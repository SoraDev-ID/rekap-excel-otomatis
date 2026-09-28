'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { UserProfile } from '@/lib/supabase/types';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        // Fetch user profile + tenant
        const { data: profile, error: profileError } = await supabase
          .from('users_profile')
          .select('id, tenant_id, full_name, role, created_at, tenants(id, name)')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError);
          router.push('/login');
          return;
        }

        setUserProfile({
          id: profile.id,
          tenant_id: profile.tenant_id,
          full_name: profile.full_name,
          role: profile.role,
          created_at: profile.created_at,
          tenant: (profile as any).tenants,
          email: user.email,
        });
      } catch (err) {
        console.error('Dashboard layout initialization error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-emerald-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Memuat workspace dan hak akses...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        userProfile={userProfile}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          userProfile={userProfile}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
