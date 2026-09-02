# Operator Admin Access Review — Procedure

**Status:** `ADMIN_ACCESS_PROCEDURE_READY`  
**Account attestation:** `OPERATOR_ACCOUNT_REVIEW_REQUIRED`  
**Date prepared:** 2026-09-02  
**Scope:** Production admin surfaces for Vercel, Supabase (`auroranexis-prod` / `norrzshzshmvbrmpmhjb`), and Mollie.  
**Hard rule:** Document procedure and attestation checklist only. Do **not** revoke, alter, rotate, or print credentials from this review.

---

## Procedure (annual)

1. Export the current admin/member list from each vendor console (names/emails/roles only — no secrets).
2. Compare against the ops password-manager inventory of authorized operators.
3. Confirm least privilege: remove unused invites; keep owner/billing contacts current.
4. Record attestation outside git (internal ticket / password-manager note) with date, reviewer, and systems covered.
5. Schedule next review ≤ 12 months.

---

## Systems checklist

| System | Console action (read-only) | Attestation field |
|--------|----------------------------|-------------------|
| Vercel | Team / project members for production project | Who has Owner/Member on Production |
| Supabase | Organization members for `auroranexis-prod` | Who has Owner/Admin |
| Mollie | Organization users with live/test dashboard access | Who can view payments / API keys |

---

## Attestation template (store outside git)

```text
Date:
Reviewer:
Vercel admins verified (Y/N):
Supabase admins verified (Y/N):
Mollie admins verified (Y/N):
Orphans / excess access found:
Next review due:
```

**Do not** commit account emails, API keys, or password-manager secrets into this repository.

---

## Result this pass

| Item | Result |
|------|--------|
| Procedure documented | `ADMIN_ACCESS_PROCEDURE_READY` |
| Live account list attestation | `OPERATOR_ACCOUNT_REVIEW_REQUIRED` (operator must complete in vendor consoles + external ticket) |
