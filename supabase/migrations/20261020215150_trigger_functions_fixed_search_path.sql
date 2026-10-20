-- Audit 2026-10-20: pin search_path on trigger functions flagged by the Supabase
-- security advisor (lint 0011 function_search_path_mutable). Behaviour is unchanged:
-- both functions only use NOW() / NEW / OLD and RAISE.
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.einvoice_archive_protect_immutable() SET search_path = public, pg_temp;
