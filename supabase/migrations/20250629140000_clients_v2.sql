-- Clients module v2 — owner assignment, health score, hard delete for Owner/Admin

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100);

CREATE INDEX IF NOT EXISTS idx_clients_org_owner ON public.clients (organization_id, owner_id);

CREATE POLICY clients_delete_owner_admin
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT DELETE ON public.clients TO authenticated;
