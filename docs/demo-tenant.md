# Demo Tenant — Aurora Demo Workspace

**Version:** Auroranexis v0.96  
**Purpose:** Sales demos, pilot previews, staging validation  
**Organization slug:** `aurora-demo`

---

## Overview

The demo workspace provides realistic sample data across all major modules without requiring manual data entry before customer meetings.

| Asset | Count |
|-------|-------|
| Clients | 10 |
| Reports | 20 |
| Risks | 8 |
| Incidents | 5 |
| Report templates | 3 |
| Report schedules | 2 |
| Automation workflows | 5 |
| Connector connections | 3 (demo display) |
| Customer invoices | 2 |
| White label settings | 1 |
| API keys | 1 (demo) |
| Compliance policies | 2 |
| Retention rules | 2 |
| Security incidents | 1 |
| GDPR requests | 1 |

Portal users and live OAuth connections require manual setup after seed (see below).

---

## Setup procedure

### 1. Create owner account

1. Go to `https://staging.auroranexis.com/signup`
2. Agency name: **Aurora Demo** (generates slug `aurora-demo`)
3. Use a dedicated demo email (e.g. `demo@yourcompany.com`)
4. Set `DEV_FORCE_PLAN=enterprise` in staging Vercel env (optional — unlocks all features for demos)

### 2. Run seed script

Supabase Dashboard → SQL Editor → paste and run:

```
supabase/scripts/seed_demo_workspace.sql
```

Or via CLI:

```bash
psql $DATABASE_URL -f supabase/scripts/seed_demo_workspace.sql
```

Script is **idempotent** — skips if demo clients already exist.

### 3. Verify seed

Run `supabase/scripts/validate_staging.sql` — demo section should show expected counts.

### 4. Manual enhancements (optional)

| Module | Action |
|--------|--------|
| Automation | Create 2 sample workflows in Automation → New workflow |
| Connectors | Connect Google or GitHub for live OAuth demo |
| Billing | Run Stripe test checkout to show invoices |
| White label | Configure branding at Settings → Branding → Publish |
| Portal | Create portal user on a demo client |
| Predictive | Visit Dashboard → Predictive → Refresh |
| Invoices | Visible after Stripe test subscription |

---

## Demo login credentials

Store demo credentials in your team password manager — **never commit to git**.

| Field | Value |
|-------|-------|
| URL | `https://staging.auroranexis.com/login` |
| Email | (your demo account) |
| Plan | Enterprise (via subscription or `DEV_FORCE_PLAN`) |

---

## Sales demo flow (30 min)

1. **Dashboard** — portfolio overview, upcoming schedules
2. **Clients** — ClickableRow navigation, status badges
3. **Reports** — draft → ready → publish workflow
4. **Risks / Incidents** — operational modules + AI assistant (if key present)
5. **Automation** — workflow builder + execution history
6. **Compliance** — audit explorer, GDPR request
7. **Settings → Diagnostics** — production readiness score
8. **Client portal** — scoped client view (if portal user created)

---

## Reset demo data

To refresh demo data:

```sql
-- Careful: deletes demo org data only
DELETE FROM public.organizations WHERE slug = 'aurora-demo';
-- Then re-signup and re-run seed script
```

Prefer creating a fresh staging Supabase branch for major demo resets.

---

## Related

- [deployment-staging.md](./deployment-staging.md)
- [pilot-program.md](./pilot-program.md)
