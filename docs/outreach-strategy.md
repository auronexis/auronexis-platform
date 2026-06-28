# Outreach Strategy — v1.0.0

## Channels

| Channel | Inbox | Form |
|---------|-------|------|
| Website contact | info@ | `/contact` |
| Pilot program | sales@ | `/pilot-program#apply` |
| Demo requests | sales@ | `/contact` (Book demo) |
| Newsletter | info@ | `/pricing` |
| Referrals | sales@ | `/contact` (Partner referral) |
| Security reports | security@ | security@ email |

## Email notification

Each capture triggers Resend notification to the routed inbox address.

## Follow-up SLA

| Stage | SLA |
|-------|-----|
| New lead | Respond within 1 business day |
| Pilot application | Respond within 4 hours |
| Demo request | Send calendar link within 4 hours |
| Qualified | Proposal within 3 business days |

## Sequences

1. **Pilot lead** — acknowledge → qualify → book discovery
2. **Pilot application** — review → discovery → proposal
3. **Demo** — calendar link → discovery call → follow-up note in CRM
4. **Newsletter** — welcome → product update → pilot CTA

## Activity logging

Log every touch in lead activity feed:

- `outreach` — inbound form
- `email` — outbound email
- `call` — phone conversation
- `meeting` — discovery/demo
- `note` — internal note

## Metrics

Track in `/sales`:

- Lead velocity (30-day new leads)
- Conversion rate (won / closed)
- MRR pipeline
- Inbox volume by address
