-- Phase 22.1 — Persist dashboard activation panel dismissal

ALTER TABLE public.organization_activation_preferences
  ADD COLUMN IF NOT EXISTS activation_panel_dismissed_at TIMESTAMPTZ;
