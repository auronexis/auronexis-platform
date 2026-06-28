# Outreach Library — v1.0.1

**Source:** `src/lib/sales/outreach-templates.ts`

## Templates (10)

| Key | Use case |
|-----|----------|
| `cold_outreach` | First touch to unknown prospect |
| `warm_outreach` | Post-demo or pilot page engagement |
| `linkedin_dm` | Connection request / short DM |
| `email_sequence` | Day 1 nurture email |
| `follow_up` | Day 3 bump |
| `meeting_confirmation` | Discovery call confirmed |
| `proposal_mail` | Send commercial proposal |
| `pilot_acceptance` | Founding slot granted |
| `pilot_rejection` | Waitlist / next cohort |
| `win_back` | Re-engage stale opportunities |

## Merge variables

- `{{contact_name}}`
- `{{company_name}}`
- `{{pain_points}}`
- `{{booking_link}}`
- `{{google_meet_url}}`
- `{{potential_mrr}}`
- `{{slots_remaining}}`
- `{{sender_name}}`
- `{{slot_number}}`
- `{{meeting_date}}`

## Cadence

Default email cadence: **1, 3, 7, 14** days (`EMAIL_CADENCE_DAYS` in `automation.ts`).

## In-app access

Settings → Sales → **Templates** (`/sales/templates`).

## Best practices

1. Personalize `pain_points` from enrichment.
2. Keep cold emails under 120 words.
3. One CTA per message (book call or reply).
4. Log activity on the lead record after each send.
