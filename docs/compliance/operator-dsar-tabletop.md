# Operator DSAR Tabletop — Arts. 15–21

**Status:** `DSAR_TABLETOP_READY_NOT_EXECUTED`  
**Related playbooks:** [`dsar-operator-playbooks.md`](./dsar-operator-playbooks.md)  
**Product registry:** Compliance center `gdpr_requests` — tracking only; fulfillment is manual.  
**Rule:** Fictional requests only. **No real deletion, export of production PII into this repo, or one-click wipe.**

---

## Common intake (all rights)

1. Log request type, subject email, org scope, received date in Compliance → GDPR.  
2. Verify identity / authority.  
3. Confirm systems in scope (store map in playbooks).  
4. Check legal holds and statutory retention **before** erasure.  
5. Record search notes and closure evidence.

---

## Scenario pack (FICTIONAL)

Assume one B2B workspace user (“Alex Example”, alex@example-customer.com) at customer org “Example GmbH”.

### A — ACCESS (Art. 15)

| Step | Tabletop action | Pass criteria |
|------|-----------------|---------------|
| A1 | Verify Alex owns the user account | Identity gate documented |
| A2 | Discover stores: Auth/profile, memberships, audit subset, AI logs if any, marketing if any | Store map checked |
| A3 | Prepare **redacted** package outline (no secrets, no other tenants) | Export plan listed |
| A4 | Draft response covering purposes, categories, recipients/subprocessors summary, retention intent, rights | Response outline exists |
| A5 | Mark request completed with delivery evidence (simulated) | Checklist complete |

**Do not:** dump service-role keys or raw multi-tenant logs.

### B — ERASURE (Art. 17)

| Class | Tabletop handling |
|-------|-------------------|
| Erasable ops data | Plan operator-assisted delete/anonymize; prefer archive-first for clients |
| Marketing / consent | Plan delete or suppress; `consent_records` withdrawal |
| AI logs | Plan delete/anonymize absent legal hold |
| Sales invoices / E-Invoice archive | **Exclude** — document statutory basis |
| Security logs needed for incidents | Restrict/minimize rather than wholesale delete |

**Do not:** run destructive production wipes during tabletop.

### C — RECTIFICATION (Art. 16)

| Step | Tabletop action |
|------|-----------------|
| C1 | Incorrect phone on profile vs email identity |
| C2 | Correct via product admin/profile flows (simulate) |
| C3 | Note immutable audit/billing snapshots that cannot change |
| C4 | Propagate to ESP/support mailbox only if proportionate (simulate decision) |

### D — PORTABILITY (Art. 20)

| Step | Tabletop action |
|------|-----------------|
| D1 | Scope to data provided by subject + automated processing under contract/consent |
| D2 | Plan machine-readable JSON/CSV of in-scope fields |
| D3 | Exclude derived confidential models, third-party data, PSP full payment payloads, secrets |

### E — OBJECTION (Art. 21)

| Step | Tabletop action |
|------|-----------------|
| E1 | Direct marketing: stop newsletter; update consent evidence |
| E2 | Legitimate-interest processing: assess override; document |
| E3 | Ensure optional analytics/marketing tags respect withdrawal (consent store + GA fail-closed architecture) |

### F — RESTRICTION (Art. 18) — optional add-on

Flag records / pause non-essential marketing, optional analytics, non-critical AI; document partial technical restriction.

---

## Closure checklist (per right exercised)

- [ ] Identity/authority verified  
- [ ] Deadline tracked  
- [ ] Discovery notes attached  
- [ ] Legal-retention exclusions listed (if any)  
- [ ] Processor actions recorded  
- [ ] Subject response sent (or lawful refusal documented)  
- [ ] GDPR request status updated  
- [ ] Evidence retained  

---

## Drill execution record

| Field | Value |
|-------|--------|
| Executed? | **NO** — `DSAR_TABLETOP_READY_NOT_EXECUTED` |
| Date | — |
| Rights drilled | — |
| Gaps found | — |
| Follow-ups | — |
