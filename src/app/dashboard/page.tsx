'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MetricCard } from '@/components/MetricCard';
import { RoleBadge } from '@/components/RoleBadge';
import {
  FileSpreadsheet,
  FolderOpen,
  BarChart3,
  Upload,
  ArrowRight,
  Download,
  Clock,
  ShieldCheck,
  Building2,
  FileCheck2,
  Loader2,
} from 'lucide-react';
import { UploadedFile, RecapResult, UserProfile } from '@/lib/supabase/types';

export default function DashboardOverviewPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [recaps, setRecaps] = useState<RecapResult[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get Profile
        const { data: profileData } = await supabase
          .from('users_profile')
          .select('id, tenant_id, full_name, role, created_at, tenants(name)')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile({
            ...profileData,
            tenant: (profileData as any).tenants,
          });
        }

        // 2. Fetch Files (automatically filtered by RLS for current tenant & role)
        const { data: filesData } = await supabase
          .from('uploaded_files')
          .select('id, tenant_id, file_name, file_size, mime_type, uploaded_at, status, uploaded_by')
          .order('uploaded_at', { ascending: false })
          .limit(5);

        if (filesData) {
          setFiles(filesData as any);
        }

        // 3. Fetch Recaps
        const { data: recapsData } = await supabase
          .from('recap_results')
          .select('id, tenant_id, file_id, summary_data, created_at, uploaded_files(file_name)')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recapsData) {
          setRecaps(recapsData as any);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700/60 px-3 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-200">
            <Building2 className="h-3.5 w-3.5" />
            <span>{profile?.tenant?.name || 'Workspace Perusahaan'}</span>
          </div>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight">
            Selamat Datang, {profile?.full_name}
          </h1>
          <p className="mt-1 text-xs text-emerald-100/80">
            Kelola dan buat ringkasan data spreadsheet perusahaan secara terisolasi dan terenkripsi.
          </p>
        </div>

        {profile?.role !== 'viewer' && (
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-sm hover:bg-emerald-50 transition-colors self-start sm:self-auto"
          >
            <Upload className="h-4 w-4 text-emerald-600" />
            <span>Upload File Excel</span>
          </Link>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="File Terunggah"
          value={files.length}
          subtitle="File aktif dalam tenant"
          icon={<FolderOpen className="h-5 w-5 text-emerald-600" />}
          variant="brand"
        />
        <MetricCard
          title="Laporan Rekap"
          value={recaps.length}
          subtitle="Agregasi otomatis tersimpan"
          icon={<BarChart3 className="h-5 w-5 text-sky-600" />}
          variant="accent"
        />
        <MetricCard
          title="Peran Hak Akses"
          value={profile?.role.toUpperCase() || 'STAFF'}
          subtitle="Tingkat izin keamanan RLS"
          icon={<ShieldCheck className="h-5 w-5 text-purple-600" />}
          variant="default"
        />
        <MetricCard
          title="Status Isolasi"
          value="AKTIF"
          subtitle="Enkripsi data & partisi path"
          icon={<FileCheck2 className="h-5 w-5 text-emerald-600" />}
          variant="default"
        />
      </div>

      {/* Sample Files Download Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              File Contoh untuk Pengujian Rekap
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Gunakan file spreadsheet contoh ini untuk menguji fitur validasi, preview 10 baris, sanitasi formula, dan visualisasi grafik:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/samples/Laporan_Penjualan_Q1_2026.xlsx"
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Contoh Penjualan (12 Baris)</span>
            </a>
            <a
              href="/samples/Laporan_Pengeluaran_2026.xlsx"
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-sky-600" />
              <span>Contoh Pengeluaran (9 Baris)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Tables Section: Recent Files & Recent Recaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-emerald-600" />
              Berkas Terakhir Diunggah
            </h3>
            <Link
              href="/dashboard/files"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {files.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada file diunggah.
              </p>
            ) : (
              files.map((file) => (
                <div key={file.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file.file_name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(file.uploaded_at)}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {file.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Recaps */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-600" />
              Laporan Rekap Terbaru
            </h3>
            <span className="text-xs text-slate-400">{recaps.length} Hasil</span>
          </div>

          <div className="mt-4 space-y-3">
            {recaps.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Belum ada laporan rekap data.
              </p>
            ) : (
              recaps.map((recap) => (
                <Link
                  key={recap.id}
                  href={`/dashboard/recap/${recap.id}`}
                  className="block rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-emerald-800/60"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {recap.summary_data.recapTitle}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        File: {(recap as any).uploaded_files?.file_name || 'Excel File'} &bull; Group by: {recap.summary_data.groupByColumn}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      Buka <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">
                      Total Baris: <strong className="text-slate-700 dark:text-slate-300">{recap.summary_data.totalRecords}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Akumulasi: <strong className="text-emerald-700 dark:text-emerald-400">{new Intl.NumberFormat('id-ID').format(recap.summary_data.overallSum)}</strong>
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
