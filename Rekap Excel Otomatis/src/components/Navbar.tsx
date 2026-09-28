'use client';

import React from 'react';
import { Menu, Moon, Sun, Shield } from 'lucide-react';
import { UserProfile } from '@/lib/supabase/types';

interface NavbarProps {
  userProfile: UserProfile | null;
  onOpenMobileMenu: () => void;
}

export function Navbar({ userProfile, onOpenMobileMenu }: NavbarProps) {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    // Check initial dark mode from document
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Tenant:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {userProfile?.tenant?.name || 'Workspace Aktif'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle tema gelap / terang"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Chip */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {userProfile?.full_name || 'Memuat...'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-tight">
              {userProfile?.role || 'Staff'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
