# DSAR operator playbooks (GDPR Arts. 15–21)

**Audience:** compliance / support operators  
**Status:** Operator-assisted procedures — **no one-click production wipe**  
**Product registry:** Compliance center GDPR requests (`gdpr_requests`) — tracking only; fulfillment is manual.

Identity and authority must be verified before disclosure or erasure. Statutory deadlines typically start on receipt of a valid request (generally one month, extendable as permitted by law — confirm with counsel for edge cases).

## Common intake

1. Log request in Compliance → GDPR (type, subject email, notes, received date).
2. Verify identity (account ownership, portal user, or documented authority for third-party requests).
3. Confirm scope (organization/tenant, time range, systems).
4. Check legal holds and statutory retention exclusions before erasure/restriction.
5. Coordinate processors/sub-processors only as needed; never share secrets in tickets.
6. Record evidence of search, decisions, and closure; update request status.

### Store map (starting points)

| Domain | Typical stores |
|--------|----------------|
| Account / auth | Supabase Auth, `profiles`, memberships |
| Workspace ops | clients, risks, incidents, reports, monitoring, automation |
| Portal | portal users / portal activity |
| Billing | subscriptions, sales invoices, Mollie PSP records (statutory) |
| E-Invoice archive | compliance e-invoice archive (legal retention) |
| Marketing leads | `sales_leads`, `consent_records` |
| AI | `ai_request_logs` / related AI history |
| Security / audit | audit events, security incident records, logs |
| Analytics | consent-gated third parties (GA4/PostHog/etc.) — limited retention/control |

---

## ACCESS (Art. 15)

- Confirm identity; scope to relevant controller/processor role.
- Discover personal data across store map; export structured package where tools exist (`compliance` export helpers).
- Include processing purposes, categories, recipients/sub-processors summary, retention intent, rights summary.
- Redact third-party and secret data; do not dump service-role keys or raw logs with secrets.
- Close with delivery evidence and request status `completed`.

## RECTIFICATION (Art. 16)

- Verify incorrect fields vs authoritative source.
- Correct erasable SaaS fields (profile, client contacts, lead notes) via product admin flows.
- Propagate to processors if they hold copies (email ESP, support mailbox) where proportionate.
- Document what could not be changed (immutable audit/billing snapshots) and why.

## ERASURE (Art. 17)

Distinguish:

| Class | Handling |
|-------|----------|
| Erasable SaaS operational data | Operator-assisted delete/anonymize per tenant procedures; prefer archive-first for clients |
| Marketing leads / consent | Delete or suppress; record withdrawal in `consent_records` |
| AI logs | Delete/anonymize where no legal hold |
| Statutory / accounting / sales invoices / E-Invoice archive | **Do not auto-delete**; exclude with documented legal basis |
| Security logs needed for incidents | Restrict/minimize rather than wholesale delete when retention is necessary |

Never run destructive production wipes from a single UI click. Use verified scripts/checklists with dual control for high-impact tenants.

## RESTRICTION (Art. 18)

- Flag records / pause non-essential processing (marketing, optional analytics, non-critical AI).
- Keep data visible to authorized staff for the dispute/limitation period.
- Document systems where technical restriction is partial and compensating controls used.

## PORTABILITY (Art. 20)

- Applicable mainly to data provided by the subject and processed by automated means under contract/consent.
- Export machine-readable JSON/CSV of in-scope fields; exclude derived confidential models and third-party data.
- Do not include PSP full payment payloads or secrets.

## OBJECTION (Art. 21)

- Direct marketing: stop marketing emails; update consent evidence (`granted=false` / withdrawn).
- Legitimate-interest processing: assess override; document outcome.
- Ensure optional analytics/marketing tags respect withdrawal (client consent store + server GA fail-closed).

## Closure checklist

- [ ] Identity/authority verified
- [ ] Deadline tracked
- [ ] Discovery notes attached
- [ ] Legal-retention exclusions listed (if any)
- [ ] Processor actions recorded
- [ ] Subject response sent (or lawful refusal documented)
- [ ] GDPR request status updated
- [ ] Evidence retained per security/compliance policy
