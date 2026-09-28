'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RecapCharts } from '@/components/RecapCharts';
import { MetricCard } from '@/components/MetricCard';
import {
  FileSpreadsheet,
  Download,
  ArrowLeft,
  Calendar,
  Layers,
  FileCheck,
  ShieldAlert,
  Loader2,
  Database,
  Calculator,
} from 'lucide-react';
import { RecapResult } from '@/lib/supabase/types';

export default function RecapDetailPage() {
  const params = useParams();
  const recapId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [recap, setRecap] = useState<RecapResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadRecap() {
      try {
        const { data, error } = await supabase
          .from('recap_results')
          .select('id, tenant_id, file_id, summary_data, created_at, uploaded_files(file_name, file_size, uploaded_at)')
          .eq('id', recapId)
          .single();

        if (error || !data) {
          setErrorMsg('Data rekap tidak ditemukan atau Anda tidak memiliki izin akses.');
          return;
        }

        setRecap(data as any);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memuat rekap.');
      } finally {
        setLoading(false);
      }
    }

    if (recapId) {
      loadRecap();
    }
  }, [recapId, supabase]);

  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/recap/export?id=${recapId}`);
      if (!res.ok) {
        throw new Error('Gagal mengekspor file.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hasil_Rekap_${recap?.summary_data.groupByColumn}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (errorMsg || !recap) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/40">
        <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">{errorMsg}</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Ringkasan</span>
        </Link>
      </div>
    );
  }

  const { summary_data } = recap;
  const fileName = (recap as any).uploaded_files?.file_name || 'Spreadsheet File';

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/files"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Daftar File</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {summary_data.recapTitle}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Sumber: <strong>{fileName}</strong></span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(recap.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
        </div>

        <button
          onClick={handleDownloadExcel}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors self-start sm:self-auto"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Membuat File Excel...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export Hasil ke Excel (.xlsx)</span>
            </>
          )}
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={`Total Akumulasi (${summary_data.metricColumn})`}
          value={formatNumber(summary_data.overallSum)}
          subtitle={`Akumulasi seluruh baris (${summary_data.aggregation.toUpperCase()})`}
          icon={<Calculator className="h-5 w-5 text-emerald-600" />}
          variant="brand"
        />
        <MetricCard
          title={`Rata-Rata (${summary_data.metricColumn})`}
          value={formatNumber(summary_data.overallAverage)}
          subtitle="Rata-rata tertimbang per entri"
          icon={<Layers className="h-5 w-5 text-sky-600" />}
          variant="accent"
        />
        <MetricCard
          title="Total Baris Terproses"
          value={summary_data.totalRecords}
          subtitle={`Diuraikan menjadi ${summary_data.aggregations.length} kelompok ${summary_data.groupByColumn}`}
          icon={<Database className="h-5 w-5 text-slate-700 dark:text-slate-300" />}
          variant="default"
        />
        <MetricCard
          title="Sanitasi Formula"
          value={summary_data.sanitizedFormulasCount || 0}
          subtitle="Sel berpotensi injeksi dinetralkan"
          icon={<FileCheck className="h-5 w-5 text-emerald-600" />}
          variant="default"
        />
      </div>

      {/* Chart Visualizer */}
      <RecapCharts
        data={summary_data.aggregations}
        groupByColumn={summary_data.groupByColumn}
        metricColumn={summary_data.metricColumn}
        aggregation={summary_data.aggregation}
      />

      {/* Sample Rows Preview from Source */}
      {summary_data.sampleRows && summary_data.sampleRows.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Sampel Baris Asli (10 Baris Pertama)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  {summary_data.columns.map((col) => (
                    <th key={col} className="px-3.5 py-2 font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary_data.sampleRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    {summary_data.columns.map((col) => (
                      <td key={col} className="px-3.5 py-2 font-mono text-[11px] whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
