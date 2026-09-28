'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  History,
  Upload,
  BarChart3,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  User,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { ActivityLog } from '@/lib/supabase/types';

export default function ActivityLogPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const { data, error } = await supabase
          .from('activity_log')
          .select(`
            id,
            tenant_id,
            user_id,
            action,
            detail,
            created_at,
            users_profile(full_name, role)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (data) {
          setLogs(
            data.map((item: any) => ({
              ...item,
              user_profile: item.users_profile,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [supabase]);

  const renderActionBadge = (action: string) => {
    switch (action) {
      case 'UPLOAD_FILE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Upload className="h-3 w-3" />
            Upload File
          </span>
        );
      case 'GENERATE_RECAP':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <BarChart3 className="h-3 w-3" />
            Generate Rekap
          </span>
        );
      case 'ADD_USER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <UserPlus className="h-3 w-3" />
            Tambah Anggota
          </span>
        );
      case 'UPDATE_ROLE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <UserCheck className="h-3 w-3" />
            Ubah Peran
          </span>
        );
      case 'DELETE_USER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <UserX className="h-3 w-3" />
            Hapus Anggota
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {action}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <History className="h-6 w-6 text-emerald-600" />
          Log Aktivitas Audit
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Catatan kronologis setiap proses unggah berkas, pembuatan ringkasan rekap, dan perubahan pengguna.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Waktu Kejadian</th>
                <th className="px-4 py-3 font-semibold">Pengguna</th>
                <th className="px-4 py-3 font-semibold">Jenis Aksi</th>
                <th className="px-4 py-3 font-semibold">Rincian Informasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Belum ada riwayat aktivitas yang tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {log.user_profile?.full_name || 'Sistem / Anonim'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {log.detail ? JSON.stringify(log.detail) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
