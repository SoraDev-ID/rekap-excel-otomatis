-- Enable pgcrypto / uuid-ossp if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE file_status AS ENUM ('processing', 'done', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Users Profile Table (links to auth.users)
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Uploaded Files Table
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status file_status NOT NULL DEFAULT 'processing'
);

-- 5. Recap Results Table
CREATE TABLE IF NOT EXISTS public.recap_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.uploaded_files(id) ON DELETE CASCADE,
  summary_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Activity Log Table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_tenant_id ON public.users_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_tenant_id ON public.uploaded_files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON public.uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_recap_results_tenant_id ON public.recap_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recap_results_file_id ON public.recap_results(file_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant_id ON public.activity_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Helper security functions for RLS
CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users_profile WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.users_profile WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- Enable Row Level Security (RLS) on ALL tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recap_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "tenants_select_policy" ON public.tenants;
DROP POLICY IF EXISTS "tenants_modify_policy" ON public.tenants;

DROP POLICY IF EXISTS "users_profile_select_policy" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile_insert_policy" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile_update_policy" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile_delete_policy" ON public.users_profile;

DROP POLICY IF EXISTS "uploaded_files_select_policy" ON public.uploaded_files;
DROP POLICY IF EXISTS "uploaded_files_insert_policy" ON public.uploaded_files;
DROP POLICY IF EXISTS "uploaded_files_update_policy" ON public.uploaded_files;
DROP POLICY IF EXISTS "uploaded_files_delete_policy" ON public.uploaded_files;

DROP POLICY IF EXISTS "recap_results_select_policy" ON public.recap_results;
DROP POLICY IF EXISTS "recap_results_insert_policy" ON public.recap_results;
DROP POLICY IF EXISTS "recap_results_update_policy" ON public.recap_results;
DROP POLICY IF EXISTS "recap_results_delete_policy" ON public.recap_results;

DROP POLICY IF EXISTS "activity_log_select_policy" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert_policy" ON public.activity_log;

-- 1. TENANTS Policies
CREATE POLICY "tenants_select_policy" ON public.tenants
FOR SELECT
USING (
  public.is_super_admin() OR id = public.current_user_tenant_id()
);

CREATE POLICY "tenants_modify_policy" ON public.tenants
FOR ALL
USING (
  public.is_super_admin()
);

-- 2. USERS_PROFILE Policies
CREATE POLICY "users_profile_select_policy" ON public.users_profile
FOR SELECT
USING (
  public.is_super_admin() OR tenant_id = public.current_user_tenant_id()
);

CREATE POLICY "users_profile_insert_policy" ON public.users_profile
FOR INSERT
WITH CHECK (
  public.is_super_admin()
  OR (public.is_tenant_admin() AND tenant_id = public.current_user_tenant_id())
  OR (id = auth.uid())
);

CREATE POLICY "users_profile_update_policy" ON public.users_profile
FOR UPDATE
USING (
  public.is_super_admin()
  OR (public.is_tenant_admin() AND tenant_id = public.current_user_tenant_id())
  OR (id = auth.uid())
);

CREATE POLICY "users_profile_delete_policy" ON public.users_profile
FOR DELETE
USING (
  public.is_super_admin()
  OR (public.is_tenant_admin() AND tenant_id = public.current_user_tenant_id() AND id != auth.uid())
);

-- 3. UPLOADED_FILES Policies
CREATE POLICY "uploaded_files_select_policy" ON public.uploaded_files
FOR SELECT
USING (
  public.is_super_admin()
  OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() IN ('admin', 'viewer'))
  OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'staff' AND uploaded_by = auth.uid())
);

CREATE POLICY "uploaded_files_insert_policy" ON public.uploaded_files
FOR INSERT
WITH CHECK (
  public.current_user_role() != 'viewer'
  AND (
    public.is_super_admin()
    OR (tenant_id = public.current_user_tenant_id() AND uploaded_by = auth.uid())
  )
);

CREATE POLICY "uploaded_files_update_policy" ON public.uploaded_files
FOR UPDATE
USING (
  public.current_user_role() != 'viewer'
  AND (
    public.is_super_admin()
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'admin')
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'staff' AND uploaded_by = auth.uid())
  )
);

CREATE POLICY "uploaded_files_delete_policy" ON public.uploaded_files
FOR DELETE
USING (
  public.current_user_role() != 'viewer'
  AND (
    public.is_super_admin()
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'admin')
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'staff' AND uploaded_by = auth.uid())
  )
);

-- 4. RECAP_RESULTS Policies
CREATE POLICY "recap_results_select_policy" ON public.recap_results
FOR SELECT
USING (
  public.is_super_admin()
  OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() IN ('admin', 'viewer'))
  OR (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() = 'staff'
    AND EXISTS (
      SELECT 1 FROM public.uploaded_files uf
      WHERE uf.id = public.recap_results.file_id AND uf.uploaded_by = auth.uid()
    )
  )
);

CREATE POLICY "recap_results_insert_policy" ON public.recap_results
FOR INSERT
WITH CHECK (
  public.current_user_role() != 'viewer'
  AND (
    public.is_super_admin()
    OR (
      tenant_id = public.current_user_tenant_id()
      AND (
        public.current_user_role() = 'admin'
        OR (
          public.current_user_role() = 'staff'
          AND EXISTS (
            SELECT 1 FROM public.uploaded_files uf
            WHERE uf.id = public.recap_results.file_id AND uf.uploaded_by = auth.uid()
          )
        )
      )
    )
  )
);

CREATE POLICY "recap_results_update_policy" ON public.recap_results
FOR UPDATE
USING (
  public.current_user_role() != 'viewer'
  AND (
    public.is_super_admin()
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'admin')
  )
);

CREATE POLICY "recap_results_delete_policy" ON public.recap_results
FOR DELETE
USING (
  public.current_user_role() != 'viewer'
  AND (
    public.is_super_admin()
    OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'admin')
  )
);

-- 5. ACTIVITY_LOG Policies
CREATE POLICY "activity_log_select_policy" ON public.activity_log
FOR SELECT
USING (
  public.is_super_admin()
  OR (tenant_id = public.current_user_tenant_id() AND public.current_user_role() = 'admin')
  OR (tenant_id = public.current_user_tenant_id() AND user_id = auth.uid())
);

CREATE POLICY "activity_log_insert_policy" ON public.activity_log
FOR INSERT
WITH CHECK (
  tenant_id = public.current_user_tenant_id() AND user_id = auth.uid()
);

-- 7. Supabase Storage Setup for 'excel-files'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'excel-files',
  'excel-files',
  false,
  10485760, -- 10MB
  ARRAY[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv'
  ];

-- Storage RLS
DROP POLICY IF EXISTS "storage_excel_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_excel_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_excel_delete" ON storage.objects;

CREATE POLICY "storage_excel_select" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'excel-files'
  AND (
    public.is_super_admin()
    OR (
      (split_part(name, '/', 1))::text = (public.current_user_tenant_id())::text
      AND (
        public.current_user_role() IN ('admin', 'viewer')
        OR (public.current_user_role() = 'staff' AND owner = auth.uid())
      )
    )
  )
);

CREATE POLICY "storage_excel_insert" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'excel-files'
  AND public.current_user_role() != 'viewer'
  AND (
    public.is_super_admin()
    OR (split_part(name, '/', 1))::text = (public.current_user_tenant_id())::text
  )
);

CREATE POLICY "storage_excel_delete" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'excel-files'
  AND public.current_user_role() != 'viewer'
  AND (
    public.is_super_admin()
    OR (
      (split_part(name, '/', 1))::text = (public.current_user_tenant_id())::text
      AND (
        public.current_user_role() = 'admin'
        OR owner = auth.uid()
      )
    )
  )
);
