-- Build Bible V2 Chapter 9: expanded workspace currencies + organization regional settings

DO $$
DECLARE
  r RECORD;
BEGIN
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
END $$;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_currency_check
  CHECK (
    currency IN (
      'USD', 'EUR', 'GBP', 'CAD', 'AUD',
      'CHF', 'JPY', 'NOK', 'SEK', 'DKK',
      'PLN', 'CZK', 'RON'
    )
  );

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS time_format TEXT NOT NULL DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS week_start TEXT NOT NULL DEFAULT 'monday',
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
