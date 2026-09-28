import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'brand' | 'accent';
}

export function MetricCard({ title, value, subtitle, icon, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100',
    brand: 'bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border-emerald-200 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100',
    accent: 'bg-gradient-to-br from-sky-500/10 via-white to-white dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900 border-sky-200 dark:border-sky-800/60 text-slate-900 dark:text-slate-100',
  };

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
