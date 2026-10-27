-- Self-serve 7-day free trial (no payment details).
--
-- A trial is a plan override with source = 'trial' and an expiry. The application treats an
-- override whose expires_at has passed as expired, so no job is needed to end trials.
--
-- trial_claims stores only SHA-256 hashes of the normalized email address and, for company
-- domains, of the domain — enough to allow one trial per address and per company without
-- keeping the address itself. Service role only (RLS on, no policies).

alter table public.organization_plan_overrides
  add column if not exists source text not null default 'admin',
  add column if not exists expires_at timestamptz;

alter table public.organization_plan_overrides
  drop constraint if exists organization_plan_overrides_source_check;
alter table public.organization_plan_overrides
  add constraint organization_plan_overrides_source_check check (source in ('admin', 'trial'));

alter table public.organization_plan_overrides
  drop constraint if exists organization_plan_overrides_trial_expiry_check;
alter table public.organization_plan_overrides
  add constraint organization_plan_overrides_trial_expiry_check
  check (source <> 'trial' or expires_at is not null);

create table if not exists public.trial_claims (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  domain_hash text,
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists trial_claims_email_hash_key on public.trial_claims (email_hash);
create unique index if not exists trial_claims_domain_hash_key
  on public.trial_claims (domain_hash) where domain_hash is not null;

alter table public.trial_claims enable row level security;
revoke all on public.trial_claims from anon, authenticated;

comment on table public.trial_claims is
  'One free trial per normalized email and per company domain. Stores SHA-256 hashes only.';
