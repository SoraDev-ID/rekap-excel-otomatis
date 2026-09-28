'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, Table as TableIcon } from 'lucide-react';
import { AggregationRow } from '@/lib/supabase/types';

interface RecapChartsProps {
  data: AggregationRow[];
  groupByColumn: string;
  metricColumn: string;
  aggregation: string;
}

export function RecapCharts({ data, groupByColumn, metricColumn, aggregation }: RecapChartsProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'line' | 'table'>('bar');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatCurrency = (value: any) => {
    if (typeof value === 'number') {
      return formatNumber(value);
    }
    return value;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Chart Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Visualisasi Distribusi: {metricColumn} per {groupByColumn}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Metrik utama terhitung ({aggregation.toUpperCase()})
          </p>
        </div>

        {/* View Switch Buttons */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800">
          <button
            onClick={() => setViewMode('bar')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'bar'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Grafik Batang</span>
          </button>

          <button
            onClick={() => setViewMode('line')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'line'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <LineIcon className="h-3.5 w-3.5" />
            <span>Tren Garis</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Tabel Data</span>
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="mt-6">
        {viewMode === 'bar' && (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="group"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}M`;
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}Jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                  }}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), metricColumn]}
                  labelFormatter={(label) => `${groupByColumn}: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.6)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Bar
                  dataKey={aggregation === 'count' ? 'count' : aggregation === 'average' ? 'average' : 'sum'}
                  name={`${aggregation.toUpperCase()} (${metricColumn})`}
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'line' && (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="group"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}M`;
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}Jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                  }}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), metricColumn]}
                  labelFormatter={(label) => `${groupByColumn}: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.6)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={aggregation === 'count' ? 'count' : aggregation === 'average' ? 'average' : 'sum'}
                  name={`${aggregation.toUpperCase()} (${metricColumn})`}
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0284c7' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">No</th>
                  <th className="px-4 py-2.5 font-semibold">{groupByColumn}</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Frekuensi (Count)</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Total Sum</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Rata-Rata (Avg)</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Min</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{row.group}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{row.count}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {formatNumber(row.sum)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatNumber(row.average)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatNumber(row.min)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatNumber(row.max)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
