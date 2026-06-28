# Pilot Program Report — Phase 5 Sprint 1

**Date:** 2025-06-23  
**Version:** Auroranexis v0.96  
**Program:** 3 customers × 6 weeks

---

## Summary

Pilot program foundation is documented and ready for customer recruitment. The program focuses on direct support, discounted pricing, weekly feedback, and feature prioritization without scope expansion during the pilot.

---

## Program design

| Parameter | Value |
|-----------|-------|
| Pilot slots | 3 agencies |
| Duration | 6 weeks |
| Discount | 50% off selected plan ([pricing-beta.md](./pricing-beta.md)) |
| Support | Direct channel + weekly 30-min call |
| Success criteria | Active usage, 2+ connectors, weekly reports, NPS ≥ 7 |

---

## Documentation delivered

| Document | Purpose |
|----------|---------|
| [pilot-program.md](./pilot-program.md) | Program overview, eligibility, timeline |
| [pilot-onboarding.md](./pilot-onboarding.md) | Day-0 through week-1 checklist |
| [pilot-feedback.md](./pilot-feedback.md) | Weekly template, severity SLAs, exit survey |
| [pricing-beta.md](./pricing-beta.md) | Pilot coupon and conversion paths |
| [demo-tenant.md](./demo-tenant.md) | Sales demo workspace setup |

---

## Demo workspace

Seed script: `supabase/scripts/seed_demo_workspace.sql`

| Asset | Count |
|-------|-------|
| Clients | 10 |
| Reports | 20 |
| Risks | 15 |
| Incidents | 12 |
| Report templates | 3 |
| Report schedules | 2 |
| Compliance policies | 2 |
| GDPR sample request | 1 |

Org slug: `aurora-demo` — create owner account first, then run script in Supabase SQL editor.

---

## Onboarding flow (pilot customer)

1. Send pilot agreement + [pilot-onboarding.md](./pilot-onboarding.md) checklist
2. Customer signs up on staging (or production pilot flag)
3. Apply Stripe coupon `PILOT50` at checkout
4. Week 0 kickoff call — success criteria, feedback channel
5. Weeks 1–5 — weekly feedback per [pilot-feedback.md](./pilot-feedback.md)
6. Week 6 — exit survey, conversion or offboarding

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| OAuth misconfiguration | [oauth-setup.md](./oauth-setup.md) + connector validation doc |
| Billing confusion | Stripe test mode on staging; clear pricing doc |
| Support overload | Cap at 3 pilots; severity SLAs in feedback doc |
| Data quality in demos | Idempotent seed script; refresh before sales calls |

---

## Readiness

| Area | Status |
|------|--------|
| Program docs | ✅ Ready |
| Pricing / coupon plan | ✅ Documented |
| Demo tenant script | ✅ Schema-aligned |
| Staging environment | ⏳ Deploy per deployment report |
| Customer contracts | ⏳ Legal / business action |

---

## Related

- [launch-preparation-report.md](./launch-preparation-report.md)
- [launch-readiness-v0.96.md](./launch-readiness-v0.96.md)
- [deployment-report.md](./deployment-report.md)
