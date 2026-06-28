# Lead Pipeline — Technical Reference

**Version:** v1.0.0

## Schema

### `sales_leads`

| Field | Description |
|-------|-------------|
| `pipeline_stage` | 8-stage enum |
| `lead_source` | contact, pilot, demo, newsletter, referral, signup, other |
| `inbox_key` | support, sales, info, security |
| `contact_name`, `contact_email` | Required |
| `company_name`, `company_size`, `website`, `industry`, `employee_count` | Firmographics |
| `pain_points`, `notes`, `message` | Qualification text |
| `lead_value`, `mrr_estimate` | Revenue fields |
| `owner_user_id` | Assigned seller |
| `next_followup_at`, `last_contact_at` | Follow-up scheduling |
| `calendly_event_url`, `google_meet_url`, `booking_link` | Scheduling |
| `is_founding_customer`, `founding_discount_percent` | Founding program |

### `sales_lead_activities`

Activity types: `note`, `email`, `call`, `meeting`, `status_change`, `outreach`

## Capture flows

| Form | Source | Default stage | Inbox |
|------|--------|---------------|-------|
| Contact | contact | pilot_lead | info |
| Pilot application | pilot | pilot_application | sales |
| Book demo | demo | discovery_call | sales |
| Newsletter | newsletter | pilot_lead | info |
| Referral | referral | pilot_lead | sales |

## Server actions

- `src/lib/sales/capture-actions.ts` — public forms (admin client insert)
- `src/lib/sales/actions.ts` — authenticated CRM updates

## RBAC

`sales` module — Owner full access, Admin read/create/update, Staff read-only, Viewer none.

## Routes

- `/sales` — dashboard metrics
- `/sales/leads` — filtered list
- `/sales/leads/[id]` — detail + edit
- `/sales/inbox` — inbox-filtered view
