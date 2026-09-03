-- Lock client_portal_users self-update so a portal user cannot retarget
-- client_id / organization_id (which current_portal_*() would then honor).
-- last_login_at updates from signInPortal remain allowed.

DROP POLICY IF EXISTS client_portal_users_update_self_login ON public.client_portal_users;

CREATE POLICY client_portal_users_update_self_login
  ON public.client_portal_users
  FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    AND is_active = TRUE
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    AND is_active = TRUE
    AND organization_id = public.current_portal_organization_id()
    AND client_id = public.current_portal_client_id()
  );
