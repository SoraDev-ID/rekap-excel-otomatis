'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  FolderOpen,
  FileSpreadsheet,
  BarChart3,
  Download,
  Trash2,
  Clock,
  User,
  Plus,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { UploadedFile, UserProfile } from '@/lib/supabase/types';

export default function FilesPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('users_profile')
        .select('id, tenant_id, full_name, role, tenants(name)')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as any);
      }

      // Query uploaded_files with recap_results
      const { data: filesData, error } = await supabase
        .from('uploaded_files')
        .select(`
          id,
          tenant_id,
          uploaded_by,
          file_name,
          storage_path,
          file_size,
          mime_type,
          uploaded_at,
          status,
          recap_results(id, summary_data)
        `)
        .order('uploaded_at', { ascending: false });

      if (filesData) {
        setFiles(filesData as any);
      }
    } catch (err) {
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDownloadOriginal = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('excel-files')
        .download(file.storage_path);

      if (error || !data) {
        alert('Gagal mendownload file: ' + (error?.message || 'Akses ditolak'));
        return;
      }

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    }
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus file ini beserta seluruh data rekapnya?')) {
      return;
    }

    setDeletingId(fileId);
    try {
      // 1. Delete from storage
      await supabase.storage.from('excel-files').remove([storagePath]);

      // 2. Delete from uploaded_files table (cascades to recap_results)
      const { error } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId);

      if (error) {
        alert('Gagal menghapus file: ' + error.message);
      } else {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (err: any) {
      alert('Error saat menghapus: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daftar Berkas Spreadsheet
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Daftar file terisolasi berdasarkan aturan Row-Level Security ({profile?.role === 'staff' ? 'Hanya file milik Anda' : 'Semua file dalam tenant'}).
          </p>
        </div>

        {profile?.role !== 'viewer' && (
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Upload File Baru</span>
          </Link>
        )}
      </div>

      {/* Files List Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama Berkas</th>
                <th className="px-4 py-3 font-semibold">Ukuran</th>
                <th className="px-4 py-3 font-semibold">Waktu Upload</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Status Rekap</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Belum ada berkas terunggah yang dapat diakses.
                  </td>
                </tr>
              ) : (
                files.map((file) => {
                  const existingRecap = file.recap_results && file.recap_results.length > 0 ? file.recap_results[0] : null;

                  return (
                    <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            <FileSpreadsheet className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs sm:max-w-sm">
                              {file.file_name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {file.mime_type.split('/').pop()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {formatDate(file.uploaded_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {file.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {existingRecap ? (
                          <Link
                            href={`/dashboard/recap/${existingRecap.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors"
                          >
                            <BarChart3 className="h-3 w-3" />
                            <span>Lihat Rekap</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400">Belum Direkap</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadOriginal(file)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                            title="Download file asli"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Unduh</span>
                          </button>

                          {profile?.role !== 'viewer' && (
                            <button
                              onClick={() => handleDeleteFile(file.id, file.storage_path)}
                              disabled={deletingId === file.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors disabled:opacity-50"
                              title="Hapus file"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
