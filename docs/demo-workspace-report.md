# Demo Workspace Report — Phase 5 Sprint 2

**Date:** 2025-06-23  
**Workspace:** `aurora-demo`  
**Script:** `supabase/scripts/seed_demo_workspace.sql`

---

## Summary

Demo workspace seed expanded for v0.97 sales and staging validation. Script is idempotent and schema-aligned.

---

## Seeded assets

| Asset | Count | Notes |
|-------|-------|-------|
| Clients | 10 | Mixed active/watch/critical status |
| Reports | 20 | draft / ready / sent mix |
| Risks | 8 | Severity variety |
| Incidents | 5 | Open and resolved |
| Report templates | 3 | Including default |
| Report schedules | 2 | Monthly |
| Automation workflows | 5 | 3 active, 2 draft |
| Connector connections | 3 | Google, GitHub, Slack (demo metadata) |
| Customer invoices | 2 | Paid + open (demo Stripe IDs) |
| White label settings | 1 | Published branding example |
| API keys | 1 | Demo key (non-functional hash) |
| Compliance policies | 2 | SOC 2 + GDPR |
| Retention rules | 2 | Audit + reports |
| Security incidents | 1 | Resolved simulation |
| GDPR requests | 1 | Open access request |

---

## Manual setup (post-seed)

| Item | Action |
|------|--------|
| Portal users | Create via client → Portal access (requires Supabase Auth user) |
| Live OAuth | Connect real provider for live demo (optional) |
| Predictive data | Visit Dashboard → Predictive (computed from seeded clients/risks) |
| Stripe live invoices | Run test checkout for real Stripe invoice rows |

---

## Setup procedure

1. Sign up at staging: agency name **Aurora Demo** → slug `aurora-demo`
2. Optional: `DEV_FORCE_PLAN=enterprise` on staging Vercel env
3. Run seed script in Supabase SQL Editor
4. Verify with `validate_staging.sql` demo section

---

## Sales demo flow (30 min)

1. Dashboard — metrics + **Platform status** widget
2. Clients → Reports → Risks / Incidents
3. Automation — 5 demo workflows
4. Connectors — 3 demo connections + live OAuth optional
5. Compliance center
6. Settings → Billing (invoices) → Diagnostics
7. White label branding preview
8. Client portal (if portal user created)

---

## Reset

Delete org and re-signup, or use Supabase branch reset for clean slate.

---

## Related

- [demo-tenant.md](./demo-tenant.md)
- [pilot-program-report.md](./pilot-program-report.md)
