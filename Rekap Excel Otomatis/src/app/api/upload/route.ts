import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateExcelFile } from '@/lib/excel/validator';
import { parseExcelBuffer } from '@/lib/excel/parser';

// In-memory rate limiting map: userId -> [timestamps]
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 20;

  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxRequests) {
    return false;
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Batas frekuensi upload terlampaui. Tunggu 1 menit sebelum mengupload kembali.' },
        { status: 429 }
      );
    }

    // Get user profile to determine tenant_id & role
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('tenant_id, role, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil pengguna tidak ditemukan.' }, { status: 403 });
    }

    if (profile.role === 'viewer') {
      return NextResponse.json({ error: 'Role viewer tidak memiliki hak akses untuk mengupload file.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan dalam permintaan.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Validate real MIME and Magic Bytes
    const validation = validateExcelFile(buffer, file.type, file.name);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 2. Parse and sanitize Excel contents
    let parsedData;
    try {
      parsedData = parseExcelBuffer(buffer);
    } catch (parseErr: any) {
      return NextResponse.json(
        { error: `Gagal membaca isi file Excel: ${parseErr.message || 'Format tidak valid'}` },
        { status: 400 }
      );
    }

    // 3. Upload to Supabase Storage isolated by tenant_id
    const safeBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${profile.tenant_id}/${Date.now()}_${safeBaseName}`;

    const { error: storageError } = await supabase.storage
      .from('excel-files')
      .upload(storagePath, buffer, {
        contentType: validation.detectedType,
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json(
        { error: `Gagal menyimpan file ke cloud storage: ${storageError.message}` },
        { status: 500 }
      );
    }

    // 4. Insert into uploaded_files table (protected by RLS)
    const { data: fileRecord, error: dbError } = await supabase
      .from('uploaded_files')
      .insert({
        tenant_id: profile.tenant_id,
        uploaded_by: user.id,
        file_name: file.name,
        storage_path: storagePath,
        file_size: buffer.length,
        mime_type: validation.detectedType,
        status: 'processing',
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return NextResponse.json(
        { error: `Gagal mencatat metadata file: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 5. Insert activity log
    await supabase.from('activity_log').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'UPLOAD_FILE',
      detail: {
        file_id: fileRecord.id,
        file_name: file.name,
        file_size: buffer.length,
        sanitized_formulas_count: parsedData.sanitizedCount,
        threats_detected: parsedData.threatsDetected,
      },
    });

    return NextResponse.json({
      success: true,
      fileId: fileRecord.id,
      fileName: file.name,
      storagePath,
      columns: parsedData.columns,
      columnTypes: parsedData.columnTypes,
      previewRows: parsedData.previewRows,
      totalRows: parsedData.totalRows,
      sanitizedCount: parsedData.sanitizedCount,
      threatsDetected: parsedData.threatsDetected,
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada server saat memproses upload.' },
      { status: 500 }
    );
  }
}
