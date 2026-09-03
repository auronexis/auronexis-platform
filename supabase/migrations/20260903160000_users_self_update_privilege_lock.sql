-- Lock users_update_self so a member cannot escalate role, jump tenants,
-- re-enable a disabled account, or rebind auth_user_id via PostgREST.
-- Owner/admin team policies remain the only path for role / disable changes.

DROP POLICY IF EXISTS users_update_self ON public.users;

CREATE POLICY users_update_self
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    AND is_disabled = FALSE
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    AND is_disabled = FALSE
    AND organization_id = public.current_organization_id()
    AND role = public.current_user_role()
  );

-- Defense in depth: invoice sequence table is service-role / SECURITY DEFINER only.
-- Enable RLS with no authenticated policies so a future GRANT cannot leak counters.
ALTER TABLE public.sales_invoice_number_counters ENABLE ROW LEVEL SECURITY;
