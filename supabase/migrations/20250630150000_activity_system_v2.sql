-- Activity system v2 — event_type column, indexes, insert policy

ALTER TABLE public.activity_events
  ADD COLUMN IF NOT EXISTS event_type TEXT;

UPDATE public.activity_events
SET event_type = CASE
  WHEN entity_type = 'client' AND action = 'created' THEN 'client.created'
  WHEN entity_type = 'client' AND action = 'updated' THEN 'client.updated'
  WHEN entity_type = 'client' AND action = 'archived' THEN 'client.archived'
  WHEN entity_type = 'client' AND action = 'deleted' THEN 'client.deleted'
  WHEN entity_type = 'team' AND action = 'invitation_created' THEN 'team.invited'
  WHEN entity_type = 'team' AND action = 'role_changed' THEN 'team.role_updated'
  WHEN entity_type = 'team' AND action = 'user_disabled' THEN 'team.user_disabled'
  WHEN entity_type = 'team' AND action = 'user_reactivated' THEN 'team.user_reactivated'
  WHEN action = 'sla_policy_created' THEN 'sla.created'
  WHEN action IN ('sla_policy_updated', 'sla_policy_default_set', 'client_sla_policy_updated') THEN 'sla.updated'
  WHEN action = 'sla_policy_deleted' THEN 'sla.deleted'
  WHEN entity_type = 'report' AND action = 'created' THEN 'report.created'
  WHEN entity_type = 'report' AND action IN ('updated', 'report_marked_ready') THEN 'report.updated'
  WHEN entity_type = 'organization' AND action = 'organization_updated' THEN 'settings.updated'
  ELSE COALESCE(entity_type, 'unknown') || '.' || action
END
WHERE event_type IS NULL;

ALTER TABLE public.activity_events
  ALTER COLUMN event_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_events_event_type
  ON public.activity_events (organization_id, event_type);

CREATE INDEX IF NOT EXISTS idx_activity_events_entity_id
  ON public.activity_events (organization_id, entity_type, entity_id);

CREATE POLICY activity_events_insert_own_org
  ON public.activity_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_organization_id()
    AND (
      actor_user_id IS NULL
      OR actor_user_id = public.current_app_user_id()
    )
  );

GRANT INSERT ON public.activity_events TO authenticated;
