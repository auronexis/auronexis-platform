-- Auroranexis Foundation Build v1
-- Organizations, users, RLS tenancy isolation

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- users (application profile linked to auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'staff', 'viewer')),
  is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users (organization_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users (auth_user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Resolve current application user from JWT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND is_disabled = FALSE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
    AND is_disabled = FALSE
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security — organization isolation (Layer 1)
-- Role checks enforced in Server Actions (Layer 2)
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_update_self
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Inserts for org bootstrap use service role from Server Actions only.

-- Allow each user to read their own profile (session bootstrap).
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY organizations_select_member
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.organization_id = organizations.id
        AND users.auth_user_id = auth.uid()
        AND users.is_disabled = FALSE
    )
  );

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT ALL ON TABLE public.organizations TO service_role;
GRANT ALL ON TABLE public.users TO service_role;
