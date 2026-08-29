-- Entitlement plumbing: service_role table grants for organization_plan_overrides.
-- Forward-only remediation for missing grants in
-- 20250702000000_enterprise_admin_controls_v1.sql (authenticated SELECT only).
--
-- Proven createAdminClient() paths:
--   getPlanOverride / resolveOrganizationEntitlements → SELECT
--   createOrUpdatePlanOverrideAction (platform-admin upsert) → INSERT, UPDATE
-- DELETE is intentionally NOT granted (no application delete path).
-- Do NOT GRANT ALL.

GRANT SELECT, INSERT, UPDATE ON TABLE public.organization_plan_overrides TO service_role;
