import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseExcelBuffer } from '@/lib/excel/parser';
import { aggregateData } from '@/lib/excel/aggregator';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const body = await req.json();
    const { fileId, groupByColumn, metricColumn, aggregation = 'sum', recapTitle } = body;

    if (!fileId || !groupByColumn || !metricColumn) {
      return NextResponse.json(
        { error: 'Parameter fileId, groupByColumn, dan metricColumn wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Fetch file record (automatically checked by RLS: tenant & role matching)
    const { data: fileRecord, error: fileFetchError } = await supabase
      .from('uploaded_files')
      .select('id, tenant_id, file_name, storage_path, uploaded_by')
      .eq('id', fileId)
      .single();

    if (fileFetchError || !fileRecord) {
      return NextResponse.json(
        { error: 'File tidak ditemukan atau Anda tidak memiliki akses ke file ini.' },
        { status: 404 }
      );
    }

    // 2. Download file from storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('excel-files')
      .download(fileRecord.storage_path);

    if (downloadError || !fileBlob) {
      console.error('Storage download error:', downloadError);
      return NextResponse.json(
        { error: 'Gagal mengambil file dari cloud storage.' },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());

    // 3. Parse and aggregate
    const parsedData = parseExcelBuffer(buffer);
    const summaryData = aggregateData(
      parsedData.allRows,
      {
        groupByColumn,
        metricColumn,
        aggregation,
        recapTitle: recapTitle || `Rekap ${fileRecord.file_name}: ${metricColumn} per ${groupByColumn}`,
      },
      parsedData.sanitizedCount
    );

    // 4. Save recap results to database (protected by RLS)
    const { data: recapRecord, error: recapInsertError } = await supabase
      .from('recap_results')
      .insert({
        tenant_id: fileRecord.tenant_id,
        file_id: fileRecord.id,
        summary_data: summaryData,
      })
      .select()
      .single();

    if (recapInsertError) {
      console.error('Recap insert error:', recapInsertError);
      return NextResponse.json(
        { error: `Gagal menyimpan hasil rekap: ${recapInsertError.message}` },
        { status: 500 }
      );
    }

    // 5. Update file status to 'done'
    await supabase
      .from('uploaded_files')
      .update({ status: 'done' })
      .eq('id', fileRecord.id);

    // 6. Log activity
    await supabase.from('activity_log').insert({
      tenant_id: fileRecord.tenant_id,
      user_id: user.id,
      action: 'GENERATE_RECAP',
      detail: {
        recap_id: recapRecord.id,
        file_id: fileRecord.id,
        file_name: fileRecord.file_name,
        group_by: groupByColumn,
        metric: metricColumn,
        aggregation,
      },
    });

    return NextResponse.json({
      success: true,
      recapId: recapRecord.id,
      summaryData: recapRecord.summary_data,
    });
  } catch (error: any) {
    console.error('Generate recap error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat membuat rekap data.' },
      { status: 500 }
    );
  }
}
