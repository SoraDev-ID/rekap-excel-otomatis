'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataPreviewTable } from '@/components/DataPreviewTable';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload Result / Preview State
  const [fileId, setFileId] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnTypes, setColumnTypes] = useState<Record<string, 'number' | 'string' | 'date'>>({});
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [sanitizedCount, setSanitizedCount] = useState(0);
  const [threatsDetected, setThreatsDetected] = useState<string[]>([]);

  // Aggregation Configuration
  const [groupByColumn, setGroupByColumn] = useState('');
  const [metricColumn, setMetricColumn] = useState('');
  const [aggregation, setAggregation] = useState<'sum' | 'average' | 'count' | 'min' | 'max'>('sum');
  const [recapTitle, setRecapTitle] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengupload file.');
      }

      setFileId(data.fileId);
      setColumns(data.columns);
      setColumnTypes(data.columnTypes);
      setPreviewRows(data.previewRows);
      setTotalRows(data.totalRows);
      setSanitizedCount(data.sanitizedCount || 0);
      setThreatsDetected(data.threatsDetected || []);

      // Auto-select initial columns
      const firstTextCol = data.columns.find((c: string) => data.columnTypes[c] === 'string') || data.columns[0];
      const firstNumCol = data.columns.find((c: string) => data.columnTypes[c] === 'number') || data.columns[1] || data.columns[0];

      setGroupByColumn(firstTextCol);
      setMetricColumn(firstNumCol);
      setRecapTitle(`Rekap ${file.name.replace(/\.[^/.]+$/, '')}: ${firstNumCol} per ${firstTextCol}`);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateRecap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileId || !groupByColumn || !metricColumn) {
      setUploadError('Pilih kolom kategori dan metrik sebelum memproses rekap.');
      return;
    }

    setGenerating(true);
    setUploadError(null);

    try {
      const res = await fetch('/api/recap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          groupByColumn,
          metricColumn,
          aggregation,
          recapTitle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghasilkan rekap data.');
      }

      // Redirect to detailed recap page
      router.push(`/dashboard/recap/${data.recapId}`);
    } catch (err: any) {
      setUploadError(err.message);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Upload & Rekap Excel Otomatis
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Validasi biner magic-bytes, sanitasi formula injection, dan agregasi data terisolasi.
        </p>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Step 1: Upload Dropzone Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            1
          </span>
          Pilih File Spreadsheet (XLSX, XLS, CSV)
        </h2>

        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-emerald-500 transition-colors dark:border-slate-700 dark:hover:border-emerald-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 mb-3">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {file ? file.name : 'Seret & lepas file Excel di sini atau klik untuk memilih file'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Maksimum ukuran: 10 MB &bull; Didukung: .xlsx, .xls, .csv
          </p>

          <input
            type="file"
            id="excel-file-input"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <label
            htmlFor="excel-file-input"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Pilih dari Komputer</span>
          </label>
        </div>

        {file && !fileId && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 truncate">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold truncate">{file.name}</span>
              <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>

            <button
              onClick={handleUploadAndPreview}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Validasi & Parsing...</span>
                </>
              ) : (
                <>
                  <span>Lanjutkan ke Pratinjau</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Data Preview & Sanitization Check */}
      {fileId && columns.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              2
            </span>
            Pratinjau Data & Hasil Pemeriksaan Keamanan
          </h2>

          <DataPreviewTable
            columns={columns}
            columnTypes={columnTypes}
            previewRows={previewRows}
            totalRows={totalRows}
            sanitizedCount={sanitizedCount}
            threatsDetected={threatsDetected}
          />

          {/* Step 3: Aggregation Settings Form */}
          <form onSubmit={handleGenerateRecap} className="border-t border-slate-200 pt-6 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                3
              </span>
              Konfigurasi Rekap & Agregasi Otomatis
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Group By */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kelompokkan Berdasarkan (Group By)
                </label>
                <select
                  value={groupByColumn}
                  onChange={(e) => setGroupByColumn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col} ({columnTypes[col] || 'text'})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Kolom dimensi (wilayah, kategori, dept, dll.)</p>
              </div>

              {/* Metric Column */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kolom Metrik Terhitung
                </label>
                <select
                  value={metricColumn}
                  onChange={(e) => setMetricColumn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {columnTypes[col] === 'number' ? '★ (Angka)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Kolom nilai yang akan dihitung</p>
              </div>

              {/* Aggregation Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Metode Agregasi Utama
                </label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="sum">Total Akumulasi (SUM)</option>
                  <option value="average">Nilai Rata-Rata (AVERAGE)</option>
                  <option value="count">Frekuensi Kejadian (COUNT)</option>
                  <option value="min">Nilai Terendah (MIN)</option>
                  <option value="max">Nilai Tertinggi (MAX)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Fokus utama perhitungan grafik</p>
              </div>

              {/* Custom Recap Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Laporan Rekap
                </label>
                <input
                  type="text"
                  value={recapTitle}
                  onChange={(e) => setRecapTitle(e.target.value)}
                  placeholder="Laporan Rekap Q1 2026"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-slate-400">Nama untuk arsip laporan</p>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menghitung Agregasi Data...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    <span>Buat Rekap & Analisis Data</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
