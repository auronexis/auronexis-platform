-- Additive: allow owner/admin to reset white-label settings (DELETE).
-- Non-destructive; preserves existing SELECT/INSERT/UPDATE policies.

DROP POLICY IF EXISTS white_label_settings_delete_owner_admin ON public.white_label_settings;
CREATE POLICY white_label_settings_delete_owner_admin
  ON public.white_label_settings FOR DELETE TO authenticated
  USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('owner', 'admin')
  );

GRANT DELETE ON public.white_label_settings TO authenticated;
