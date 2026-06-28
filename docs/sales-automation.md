# Sales Automation — v1.0.1

**Implementation:** `src/lib/sales/automation.ts`, `src/lib/sales/actions.ts`

## Capabilities

| Feature | Description |
|---------|-------------|
| Reminder system | `sales_lead_reminders` table |
| Follow-up automation | Schedule cadence from lead detail |
| Email cadence | 1, 3, 7, 14 day steps |
| Lead aging | Flag after 7 days without contact |
| No-response detection | Flag after 5 days post-outreach |
| Escalation | Escalate after 14 days + no response |

## Reminder types

- `followup`
- `cadence`
- `escalation`
- `meeting`

## Automation scan

**Route:** `/sales/acquisition` → **Run automation scan**

Updates `no_response_flag` and `escalated_at` on eligible leads.

## Schedule follow-up

Lead detail → **Schedule cadence follow-up**

- Inserts reminder row
- Increments `outreach_sequence_step`
- Sets `next_followup_at` and `last_outreach_at`

## Thresholds

```typescript
LEAD_AGING_DAYS = 7
NO_RESPONSE_DAYS = 5
ESCALATION_DAYS = 14
EMAIL_CADENCE_DAYS = [1, 3, 7, 14]
```

## Operations

Run automation scan daily. Review overdue reminders on acquisition dashboard.
