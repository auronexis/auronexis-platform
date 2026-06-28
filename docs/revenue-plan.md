# Revenue Plan — Phase 7 Sprint 1

**Version:** v1.0.0  
**Status:** Revenue Generation  
**Goal:** Acquire first paying customers

## Objective

Shift from pilot-acquisition readiness to **revenue generation** — no new product modules, no architecture work, no redesign.

## Focus areas

1. **Sales** — pipeline dashboard, lead CRM, sales assets
2. **Onboarding** — pilot application form, founding program enrollment
3. **Lead tracking** — inbound capture, inbox routing, activity log
4. **Pilot management** — 8-stage pipeline from pilot lead to won/lost
5. **Customer acquisition** — contact, demo, newsletter, referral forms

## In-app deliverables

| Area | Route / module |
|------|----------------|
| Pipeline dashboard | `/sales` |
| Lead list | `/sales/leads` |
| Contact inbox | `/sales/inbox` |
| Pilot application | `/pilot-program#apply` |
| Contact / demo / referral | `/contact` |
| Newsletter | `/pricing` |
| Revenue readiness | Settings → Diagnostics |

## Database

Migration `20250625000000_revenue_pipeline.sql`:

- `sales_leads` — CRM records with pipeline stage, source, MRR estimate, owner, notes
- `sales_lead_activities` — outreach, notes, status changes
- `founding_program_enrollments` — 10-slot founding customer program

## Environment

| Variable | Purpose |
|----------|---------|
| `PLATFORM_SALES_ORG_ID` | Organization receiving inbound leads |
| `CALENDLY_DISCOVERY_URL` | Discovery call booking |
| `GOOGLE_CALENDAR_DISCOVERY_URL` | Calendar scheduling |
| `GOOGLE_MEET_BASE_URL` | Meet link generation |
| `RESEND_API_KEY` | Lead notification emails |

## Success criteria

- Revenue readiness score ≥ 99
- Label: **Revenue Ready**
- First 10 founding customers trackable in CRM
- All public lead forms persist to database

## Next sprints

- Stripe auto-apply founding discount codes
- HubSpot outbound sync
- CAC/churn from live billing data
