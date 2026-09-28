import * as XLSX from 'xlsx';
import { RecapSummaryData } from '../supabase/types';

export function exportRecapToExcel(summary: RecapSummaryData): Buffer {
  const wb = XLSX.utils.book_new();

  // 1. Prepare Summary Sheet Data
  const summarySheetData = summary.aggregations.map((row, idx) => ({
    'No': idx + 1,
    [summary.groupByColumn]: row.group,
    'Frekuensi (Count)': row.count,
    [`Total Sum (${summary.metricColumn})`]: row.sum,
    [`Rata-rata (${summary.metricColumn})`]: row.average,
    [`Nilai Minimum`]: row.min,
    [`Nilai Maksimum`]: row.max,
  }));

  // Add overall total row at the bottom
  summarySheetData.push({
    'No': '' as any,
    [summary.groupByColumn]: 'TOTAL KESELURUHAN',
    'Frekuensi (Count)': summary.totalRecords,
    [`Total Sum (${summary.metricColumn})`]: summary.overallSum,
    [`Rata-rata (${summary.metricColumn})`]: summary.overallAverage,
    [`Nilai Minimum`]: '' as any,
    [`Nilai Maksimum`]: '' as any,
  });

  const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);

  // Set column widths
  wsSummary['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 18 },
    { wch: 24 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_Rekap');

  // 2. Metadata Sheet
  const metadataData = [
    { Parameter: 'Judul Rekap', Nilai: summary.recapTitle },
    { Parameter: 'Kolom Kategori (Group By)', Nilai: summary.groupByColumn },
    { Parameter: 'Kolom Metrik Terhitung', Nilai: summary.metricColumn },
    { Parameter: 'Tipe Agregasi Utama', Nilai: summary.aggregation.toUpperCase() },
    { Parameter: 'Total Baris Data Terproses', Nilai: summary.totalRecords },
    { Parameter: 'Akumulasi Total (Sum)', Nilai: summary.overallSum },
    { Parameter: 'Rata-rata Keseluruhan', Nilai: summary.overallAverage },
    { Parameter: 'Sel yang Disanitasi (Formula Injection)', Nilai: summary.sanitizedFormulasCount || 0 },
    { Parameter: 'Waktu Dibuat', Nilai: new Date().toISOString() },
  ];

  const wsMeta = XLSX.utils.json_to_sheet(metadataData);
  wsMeta['!cols'] = [{ wch: 35 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Info_Audit');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
