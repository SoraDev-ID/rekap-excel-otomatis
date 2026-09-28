import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportRecapToExcel } from '@/lib/excel/exporter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const recapId = searchParams.get('id');

    if (!recapId) {
      return NextResponse.json({ error: 'Parameter id rekap diperlukan.' }, { status: 400 });
    }

    // Fetch recap result (checked by RLS)
    const { data: recap, error: recapError } = await supabase
      .from('recap_results')
      .select('id, summary_data, uploaded_files(file_name)')
      .eq('id', recapId)
      .single();

    if (recapError || !recap) {
      return NextResponse.json({ error: 'Data rekap tidak ditemukan atau tidak memiliki akses.' }, { status: 404 });
    }

    const excelBuffer = exportRecapToExcel(recap.summary_data as any);
    const baseName = (recap.uploaded_files as any)?.file_name?.replace(/\.[^/.]+$/, '') || 'Rekap';
    const exportFileName = `Hasil_${baseName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${exportFileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Export recap error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengekspor file Excel.' },
      { status: 500 }
    );
  }
}
