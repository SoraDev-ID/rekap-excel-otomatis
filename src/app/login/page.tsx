'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileSpreadsheet, Lock, Mail, User, Building2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' ? 'Email atau kata sandi tidak cocok.' : error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        // Sign Up Mode
        if (!companyName.trim() || !fullName.trim()) {
          setErrorMsg('Nama perusahaan dan nama lengkap wajib diisi.');
          setLoading(false);
          return;
        }

        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (authError) {
          setErrorMsg(authError.message);
          setLoading(false);
          return;
        }

        if (authData.user) {
          // Create tenant and profile
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert({ name: companyName })
            .select()
            .single();

          if (tenantError) {
            setErrorMsg(`Gagal mendaftarkan tenant: ${tenantError.message}`);
            setLoading(false);
            return;
          }

          const { error: profileError } = await supabase
            .from('users_profile')
            .insert({
              id: authData.user.id,
              tenant_id: tenantData.id,
              full_name: fullName,
              role: 'admin',
            });

          if (profileError) {
            setErrorMsg(`Gagal menyimpan profil: ${profileError.message}`);
            setLoading(false);
            return;
          }

          setSuccessMsg('Akun perusahaan berhasil didaftarkan. Mengalihkan ke dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1000);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
            <FileSpreadsheet className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {mode === 'login' ? 'Masuk ke Workspace Rekap' : 'Daftarkan Perusahaan Baru'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600 dark:text-slate-400">
          Sistem Rekap Excel Multi-Tenant Terisolasi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Quick Demo Accounts Selection */}
          <div className="mb-6 rounded-lg border border-emerald-200/80 bg-emerald-50/60 p-3.5 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Akun Demo Cepat (Siap Pakai):</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              Klik salah satu akun di bawah untuk menguji isolasi hak akses:
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@demo.com')}
                className="rounded-md border border-purple-200 bg-white px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300 transition-colors"
              >
                Admin (Semua Data)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff1@demo.com')}
                className="rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
              >
                Staff 1 (Penjualan)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff2@demo.com')}
                className="rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
              >
                Staff 2 (Operasional)
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mb-5 flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Daftar Perusahaan
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nama Perusahaan / Organisasi
                  </label>
                  <div className="relative mt-1">
                    <Building2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="PT Maju Bersama"
                      className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nama Lengkap Anda
                  </label>
                  <div className="relative mt-1">
                    <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Budi Setiawan"
                      className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Alamat Email
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@demo.com"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kata Sandi (Password)
              </label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Masuk ke Dashboard' : 'Buat Akun Perusahaan'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
