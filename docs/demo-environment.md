# Demo Environment — v0.995

**Workspace slug:** `aurora-demo`  
**Primary account:** `demo@auroranexis.com`  
**Staging URL:** `https://staging.auroranexis.com`

---

## Module coverage (aurora-demo)

| Module | Seeded | Notes |
|--------|--------|-------|
| Clients | 10 + Acme Automation | Flagship client renamed in hardening |
| Reports | 20 | Includes published + sent for portal |
| Schedules | 2 | Monthly cadence |
| Incidents | 5 | Mixed open/resolved |
| Risks | 8 | Severity spread |
| Automation | 5 | Active + draft workflows |
| Knowledge | Derived | From reports/clients via AI hub |
| Compliance | Policies, GDPR, audit export | CSV export sample |
| Billing | 2 demo invoices | Stripe test IDs |
| Portal | Manual invite | Create portal user on Acme client |
| Public API | 1 demo API key | Display only |
| White Label | Published branding | Aurora Command Center theme |
| Predictive | On-demand | Visit `/dashboard/predictive` → Refresh |
| Connectors | 3 display connections | Google, GitHub, Slack (demo metadata) |
| Queues | 3 jobs | Completed + pending |
| Cron | 3 execution records | Report schedules, SLA, queue worker |
| Diagnostics | Full panel | All infrastructure sections |

---

## Seed scripts (run in order)

1. `npm run seed:pilot` — creates orgs and auth accounts
2. `supabase/scripts/seed_demo_workspace.sql` — base demo data
3. `supabase/scripts/seed_demo_hardening.sql` — Acme, audit, queue, cron samples
4. `supabase/scripts/seed_persona_workspaces.sql` — 5 persona orgs

Validate with `supabase/scripts/validate_staging.sql`.

---

## Persona orgs (separate workspaces)

Each persona org has 5 clients, 6 reports, 3 risks, 2 incidents, 1 invoice, compliance sample.

Owner emails: `owner@{slugwithoutdashes}.demo` (created by seed script).

---

## Environment variables (staging)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://staging.auroranexis.com` |
| `DEV_FORCE_PLAN` | `enterprise` (optional — unlocks all modules for demos) |
| `E2E_EMAIL` | `demo@auroranexis.com` |
| `E2E_PASSWORD` | From `PILOT_SEED_PASSWORD` |

---

## Staging validation checklist

| Check | URL / action |
|-------|--------------|
| SSL | `https://staging.auroranexis.com` — padlock valid |
| Health API | `GET /api/health` — JSON 200/503 |
| Auth | Login/logout with demo account |
| Sessions | Refresh persists session |
| Cookies | Secure, SameSite on staging |
| Stripe webhook | Dashboard → 200 on test event |
| Cron | Vercel cron → `/api/cron/run` |
| Storage | White label assets upload (Settings → Branding) |
| Diagnostics | Overall ≥ 98 on demo org |

---

## Reset procedure

```sql
-- Destructive — staging only
DELETE FROM public.organizations WHERE slug IN (
  'aurora-demo', 'acme-automation', 'vertex-msp',
  'bluewave-consulting', 'novaops', 'cyberflow'
);
```

Then re-run `npm run seed:pilot` and SQL seeds.

---

## Related

- [demo-tenant.md](./demo-tenant.md)
- [pilot-execution.md](./pilot-execution.md)
- [staging-validation.md](./staging-validation.md)
