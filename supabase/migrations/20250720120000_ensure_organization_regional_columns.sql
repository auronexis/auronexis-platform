-- Ensure organization regional settings columns exist (idempotent).
-- Required for Organization Settings persistence (timezone, date/time formats, week start, measurement).
-- Safe to re-run. Does not drop data or recreate tables.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY';

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS time_format TEXT NOT NULL DEFAULT '24h';

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS week_start TEXT NOT NULL DEFAULT 'monday';

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS measurement_system TEXT NOT NULL DEFAULT 'metric';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_date_format_check'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_date_format_check
      CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_time_format_check'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_time_format_check
      CHECK (time_format IN ('12h', '24h'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_week_start_check'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_week_start_check
      CHECK (week_start IN ('monday', 'sunday'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_measurement_system_check'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_measurement_system_check
      CHECK (measurement_system IN ('metric', 'imperial'));
  END IF;
END $$;

-- Expand workspace currency allow-list to match application validation (idempotent).
DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'currency'
  ) THEN
    FOR r IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'public'
        AND rel.relname = 'organizations'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) ILIKE '%currency%'
    LOOP
      EXECUTE format('ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;

    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_currency_check
      CHECK (
        currency IN (
          'USD', 'EUR', 'GBP', 'CAD', 'AUD',
          'CHF', 'JPY', 'NOK', 'SEK', 'DKK',
          'PLN', 'CZK', 'RON'
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.organizations.timezone IS
  'IANA workspace timezone for display of dates and schedules. Storage remains UTC.';
COMMENT ON COLUMN public.organizations.date_format IS
  'Preferred date display pattern for workspace surfaces.';
COMMENT ON COLUMN public.organizations.time_format IS
  'Preferred 12h or 24h time display for workspace surfaces.';
COMMENT ON COLUMN public.organizations.week_start IS
  'First day of week for calendars and scheduling UI.';
COMMENT ON COLUMN public.organizations.measurement_system IS
  'Metric or imperial preference for future measurement displays.';

NOTIFY pgrst, 'reload schema';
