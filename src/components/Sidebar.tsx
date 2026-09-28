'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FolderOpen,
  History,
  Users,
  LogOut,
  Building2,
  ShieldCheck,
  X
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { UserProfile } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  userProfile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ userProfile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    {
      label: 'Ringkasan',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin', 'staff', 'viewer'],
    },
    {
      label: 'Upload & Rekap',
      href: '/dashboard/upload',
      icon: FileSpreadsheet,
      roles: ['super_admin', 'admin', 'staff'],
    },
    {
      label: 'Daftar File',
      href: '/dashboard/files',
      icon: FolderOpen,
      roles: ['super_admin', 'admin', 'staff', 'viewer'],
    },
    {
      label: 'Log Aktivitas',
      href: '/dashboard/activity',
      icon: History,
      roles: ['super_admin', 'admin', 'staff'],
    },
    {
      label: 'Manajemen Tim',
      href: '/dashboard/admin',
      icon: Users,
      roles: ['super_admin', 'admin'],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !userProfile || item.roles.includes(userProfile.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                RekapExcel
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Enterprise
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Tutup menu navigasi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tenant Information Card */}
        <div className="p-4">
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">{userProfile?.tenant?.name || 'Workspace Perusahaan'}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Status Akses</span>
              {userProfile && <RoleBadge role={userProfile.role} size="sm" />}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Security Indicator */}
        <div className="mx-4 mb-3 rounded-lg border border-emerald-200/60 bg-emerald-50/50 p-3 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Isolasi RLS Aktif</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
            Data terenkripsi dan terisolasi per departemen & penyewa.
          </p>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                {userProfile?.full_name || 'Pengguna'}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {userProfile?.email || 'Memuat akun...'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
              title="Keluar (Logout)"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
