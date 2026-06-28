# Pilot Checklist — v1.0 RC

**Version:** v0.995.0  
**Target:** Pilot Execution Ready (score ≥ 98)

---

## Environment

- [ ] `npm run seed:pilot` completed on staging Supabase
- [ ] SQL seeds applied (demo + hardening + personas)
- [ ] `validate_staging.sql` shows expected counts for all 6 org slugs
- [ ] `DEV_FORCE_PLAN=enterprise` on staging (optional)

## Accounts & RBAC

- [ ] `demo@auroranexis.com` — owner login works
- [ ] `pilot-owner@auroranexis.com` — admin permissions verified
- [ ] `pilot-operator@auroranexis.com` — staff CRUD verified
- [ ] `pilot-viewer@auroranexis.com` — read-only enforced
- [ ] E2E credentials in `.env.local` / CI secrets

## Demo workspace (aurora-demo)

- [ ] 10+ clients including Acme Automation
- [ ] Published/sent reports visible
- [ ] Automation, connectors, compliance populated
- [ ] Queue + cron samples in diagnostics
- [ ] White label branding published

## Staging deployment

- [ ] `https://staging.auroranexis.com` SSL valid
- [ ] `/api/health` returns JSON
- [ ] Marketing pages public (no auth redirect)
- [ ] Stripe test webhook registered
- [ ] Vercel cron active

## Commercial readiness

- [ ] Pilot invitation template ready
- [ ] Agreement draft reviewed
- [ ] Feedback survey + exit questionnaire prepared
- [ ] Discovery call script rehearsed
- [ ] `sales@auroranexis.com` monitored

## Validation

- [ ] `npm run lint` PASS
- [ ] `npm run typecheck` PASS
- [ ] `npm run build` PASS
- [ ] `npm run test:e2e` — **30/30 PASS**
- [ ] Diagnostics overall ≥ 98

## Launch

- [ ] First pilot invitation sent
- [ ] Weekly review calendar booked
- [ ] Demo script v2 walkthrough completed internally
