import React from 'react';
import { AlertTriangle, Hash, Type, Calendar } from 'lucide-react';

interface DataPreviewTableProps {
  columns: string[];
  columnTypes: Record<string, 'number' | 'string' | 'date'>;
  previewRows: Record<string, any>[];
  totalRows: number;
  sanitizedCount?: number;
  threatsDetected?: string[];
}

export function DataPreviewTable({
  columns,
  columnTypes,
  previewRows,
  totalRows,
  sanitizedCount = 0,
  threatsDetected = [],
}: DataPreviewTableProps) {
  if (!columns || columns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Belum ada data untuk dipratinjau. Silakan unggah file Excel terlebih dahulu.
      </div>
    );
  }

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />;
      case 'date':
        return <Calendar className="h-3 w-3 text-sky-600 dark:text-sky-400" />;
      default:
        return <Type className="h-3 w-3 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sanitization Alert Banner */}
      {sanitizedCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-semibold">Sanitasi Keamanan Aktif: </span>
            Ditemukan {sanitizedCount} sel dengan potensi formula berbahaya (CSV/Excel Formula Injection). Nilai telah dinetralkan dengan awalan kutip tunggal untuk mencegah eksekusi kode atau hyperlink luar.
            {threatsDetected.length > 0 && (
              <span className="block mt-1 font-mono text-[11px] opacity-90">
                Pola terdeteksi: {threatsDetected.join(', ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Pratinjau Data ({Math.min(10, previewRows.length)} dari {totalRows} baris)
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {columns.length} Kolom Terdeteksi
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-sm dark:bg-slate-800/90 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2.5 font-medium text-slate-400 dark:border-slate-700 w-12 text-center">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border-b border-slate-200 px-3.5 py-2.5 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      {renderTypeIcon(columnTypes[col] || 'string')}
                      <span>{col}</span>
                      <span className="text-[10px] font-normal text-slate-400 uppercase">
                        ({columnTypes[col] || 'str'})
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {previewRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                    {rowIdx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col];
                    const isSanitized = typeof val === 'string' && val.startsWith("'");
                    return (
                      <td
                        key={col}
                        className={`px-3.5 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300 font-mono text-[11px] ${
                          isSanitized ? 'bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' : ''
                        }`}
                      >
                        {val !== undefined && val !== null ? String(val) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
