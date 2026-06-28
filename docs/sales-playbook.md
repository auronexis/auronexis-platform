# Sales Playbook — v1.0.0

## Pipeline stages

1. **Pilot Leads** — inbound from marketing
2. **Pilot Applications** — completed pilot form
3. **Discovery Calls** — demo booked / call scheduled
4. **Qualified** — ICP fit confirmed
5. **Proposal Sent** — commercial proposal delivered
6. **Negotiation** — terms discussion
7. **Won** — paying customer
8. **Lost** — disqualified or declined

## Daily rhythm

1. Check `/sales/inbox` counters (support@, sales@, info@, security@)
2. Review leads with overdue `next_followup_at`
3. Log activity on every touch (note, email, call)
4. Move stage only when exit criteria met

## Discovery call script

1. Agency profile and client count
2. Current tooling and pain points
3. Auroranexis demo — dashboard, clients, reports
4. Pilot program terms (6 weeks, 50% beta)
5. Next step: proposal or founding enrollment

## Tools

- **CRM:** `/sales` module
- **Booking:** Calendly / Google Calendar (env configured)
- **Assets:** proposal template, pilot agreement, ROI worksheet
- **Email:** Resend notifications to inbox addresses

## Owner assignment

Assign `owner_user_id` on qualified leads. Owner responsible for follow-up and close.

## Close criteria (Won)

- Stripe subscription active OR founding enrollment recorded
- MRR estimate updated on lead record
