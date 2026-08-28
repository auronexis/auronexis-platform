-- Clients v2 forward-fix (Production remediation)
-- Supersedes unfinished effects of 20250629140000_clients_v2.sql
-- Do NOT replay 20250629140000 — owner_id / health_score already exist in Production.
--
-- Intended remnants only:
--   1) health_score CHECK 0–100 (nullable; NULL allowed)
--   2) idx_clients_org_owner (organization_id, owner_id)
--   3) DELETE RLS policy for owner/admin within tenant
--   4) GRANT DELETE TO authenticated (RLS remains the authorization gate)
--
-- Safety:
--   - Idempotent
--   - No anon grants
--   - Does not weaken tenant isolation
--   - Does not add/alter owner_id or health_score columns

-- 1) CHECK: health_score in [0, 100] when present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.clients'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%health_score%'
      AND pg_get_constraintdef(oid) ILIKE '%0%'
      AND pg_get_constraintdef(oid) ILIKE '%100%'
  ) THEN
    ALTER TABLE public.clients
      ADD CONSTRAINT clients_health_score_range_check
      CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100));
  END IF;
END $$;

-- 2) Composite owner index (distinct from clients_owner_id_idx on owner_id alone)
CREATE INDEX IF NOT EXISTS idx_clients_org_owner
  ON public.clients (organization_id, owner_id);

-- 3) Hard-delete RLS — matches insert/update owner_admin tenant pattern and HEAD deleteClientAction
DROP POLICY IF EXISTS clients_delete_owner_admin ON public.clients;

CREATE POLICY clients_delete_owner_admin
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

-- 4) Table privilege required alongside RLS (no DELETE grant today; no anon)
GRANT DELETE ON public.clients TO authenticated;
