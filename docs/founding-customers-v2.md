# Founding Customers v2 — Phase 7

**Version:** v1.0.0  
**Program limit:** 10 companies

## Offer

| Benefit | Detail |
|---------|--------|
| Beta pricing | 50% discount during 6-week pilot |
| Lifetime discount | Locked founding rate on base subscription |
| Founding badge | Customer badge in portal and marketing |
| Roadmap influence | Quarterly roadmap sessions |
| Priority support | Dedicated support queue |

## Enforcement

- `founding_program_enrollments` table — max 10 slots per sales org
- Enrollment action on lead detail: **Enroll as founding customer**
- Sets lead `is_founding_customer`, `founding_discount_percent = 50`, stage `won`

## Eligibility

Qualified agencies from pilot pipeline:

- MSPs and automation agencies
- 5+ managed clients preferred
- Committed to 6-week pilot engagement

## Tracking

Sales dashboard shows `{enrolled}/10 slots filled`.

## Sales workflow

1. Pilot application → `pilot_application` stage
2. Discovery call → qualify fit
3. Send proposal + pilot agreement
4. Enroll in founding program (consumes slot)
5. Customer signs up with discount code

## Assets

See `docs/sales-playbook.md` and in-app Sales → Sales assets.
