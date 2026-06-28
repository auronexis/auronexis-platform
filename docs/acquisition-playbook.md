# Acquisition Playbook — v1.0.1

**Status:** Customer Acquisition Ready

## Goal

Acquire the first 10 founding customers through structured outbound, enrichment, and conversion — no new platform modules.

## Workflow

1. **Build lists** — segment prospects in `/sales/outbound` (Prospects, Companies, Agencies, MSPs, Consultants, AI Agencies).
2. **Enrich leads** — website, LinkedIn, employees, location, industry, ARR/MRR estimates, pain/fit/priority scores.
3. **Outreach** — use templates in `/sales/templates` (cold, warm, LinkedIn, sequences, follow-ups).
4. **Automate** — cadence reminders, lead aging, no-response flags, escalation in `/sales/acquisition`.
5. **Convert** — discovery call → qualified → proposal → pilot → won.
6. **Success** — track onboarding milestones and renewal probability in `/sales/success`.

## Daily rhythm

| Time | Action |
|------|--------|
| Morning | Review acquisition dashboard — new leads, qualified, meetings |
| Midday | Execute outbound (20 touches) |
| Afternoon | Follow-ups and automation scan |
| End of day | Update lead scores and next follow-up dates |

## Key routes

- `/sales/acquisition` — pipeline metrics and automation
- `/sales/outbound` — list workspace
- `/sales/templates` — outreach library
- `/sales/success` — customer health

## Related docs

- `first-100-leads.md`
- `outreach-library.md`
- `lead-scoring.md`
- `sales-automation.md`
- `customer-success.md`
- `founding-customers-v3.md`
- `acquisition-readiness.md`
