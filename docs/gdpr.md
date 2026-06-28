# GDPR Module

The GDPR module supports data subject request tracking for regulated customers. It is a workflow and registry layer — not legal advice.

## Request types

| Type | Purpose |
|------|---------|
| `access` | Access request (Article 15) |
| `deletion` | Erasure request (Article 17) |
| `export` | Data portability (Article 20) |
| `correction` | Rectification (Article 16) |
| `restriction` | Processing restriction (Article 18) |
| `consent_withdrawal` | Consent withdrawal |

## Request states

`open` → `processing` → `completed` | `rejected` | `expired`

## Consent records

`consent_records` tracks subject consent by email, consent type, and grant/withdrawal timestamps.

## UI

The Compliance Center (`/dashboard/compliance`) includes:

- GDPR request intake form
- Open request counts
- Status overview

## Access control

Owner/admin only. All requests are org-scoped via RLS.

## Related tables

| Table | Purpose |
|-------|---------|
| `gdpr_requests` | Request workflow |
| `consent_records` | Consent history |
| `legal_holds` | Hold registry that may block deletion |

## Implementation

Module: `src/lib/compliance/gdpr.ts` and `src/lib/compliance/consent.ts`

Server actions: `src/lib/compliance/actions.ts`
