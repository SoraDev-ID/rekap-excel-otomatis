import Link from 'next/link';
import {
  FileSpreadsheet,
  ShieldCheck,
  Lock,
  BarChart3,
  Download,
  Users2,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">RekapExcel</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              Masuk / Buka Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Keamanan Tingkat Enterprise dengan Supabase RLS
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Rekap Data Excel Otomatis & Terisolasi Antar Departemen
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Sistem pengolahan dan agregasi file spreadsheet multi-tenant. Unggah file Excel, lakukan agregasi otomatis berdasarkan kolom pilihan, visualisasikan dengan grafik interaktif, dan ekspor kembali secara aman.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors"
            >
              <span>Akses Workspace Demo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#security"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Lihat Arsitektur Keamanan
            </a>
          </div>
        </div>

        {/* Security & Features Grid */}
        <section id="security" className="mt-20 sm:mt-28">
          <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 text-center mb-3">
              Fokus Utama: Proteksi Data
            </h2>
            <p className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-10">
              Pilar Keamanan & Isolasi Multi-Tenant
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-4">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  Row-Level Security (RLS)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Semua tabel (tenants, users_profile, files, recap_results, activity_log) dikunci kebijakan RLS tingkat basis data Postgres. Staff hanya dapat mengakses datanya sendiri, admin mengelola tenant, dan super admin lintas tenant.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="h-10 w-10 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-4">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  Sanitasi Formula Injection
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pendeteksian dan penetralan otomatis terhadap serangan CSV/Excel Injection (=cmd|, =HYPERLINK luar, DDE payload) dengan penambahan tanda kutip tunggal sebelum data direkap atau diekspor.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  Validasi Magic Bytes & Storage
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Validasi tipe file melalui header biner asli (PK\x03\x04 untuk XLSX, D0 CF 11 E0 untuk XLS). File disimpan di Supabase Storage privat dengan partisi path per tenant_id dan batas 10MB.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities Breakdown */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <BarChart3 className="h-6 w-6 text-emerald-600 mb-3" />
            <h4 className="text-sm font-semibold mb-1 text-slate-900 dark:text-white">Agregasi & Visualisasi</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Otomatis menghitung sum, average, count, min, dan max berdasarkan kolom pilihan dengan visualisasi Recharts interaktif.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Download className="h-6 w-6 text-emerald-600 mb-3" />
            <h4 className="text-sm font-semibold mb-1 text-slate-900 dark:text-white">Ekspor Ulang Excel</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hasil rekap dapat langsung diekspor kembali menjadi file spreadsheet format .xlsx lengkap dengan lembar audit metadata.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Users2 className="h-6 w-6 text-emerald-600 mb-3" />
            <h4 className="text-sm font-semibold mb-1 text-slate-900 dark:text-white">Kontrol Hak Akses RBAC</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manajemen peran (Admin, Staff, Viewer) dalam satu tenant beserta pelacakan audit log komprehensif.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>Aplikasi Rekap Excel Otomatis &bull; Multi-Tenant Enterprise Solution</p>
      </footer>
    </div>
  );
}
