# Refund → Invoice Correction Runbook

**Audience:** Operator · tax adviser · accounting  
**Status:** MANUAL_ACCOUNTING_PROCESS  
**Automated credit notes:** **NO**  
**LIVE charging:** unrelated — keep `MOLLIE_LIVE_CHARGING_ENABLED=false` until separately authorized  

**Disclaimer:** Operational process documentation only. Not tax advice.  
**TAX_ADVISER_SIGNOFF_REQUIRED** before treating this as the final production accounting SOP.

---

## Core principle

| Concept | Meaning |
|---------|---------|
| **Payment refund** | Money returned via Mollie (PSP) to the original payment method |
| **Invoice correction / credit note** | Accounting document that corrects an Auroranexis `sales_invoices` record |

**A Mollie refund is not an invoice correction.**  
Refunding a payment must **not** silently void, rewrite, or auto-credit an issued Auroranexis sales invoice.

Auroranexis is the contractual seller. Mollie is PSP only (not Merchant of Record).

---

## Operator process (12 steps)

1. **Identify the original payment** — Mollie payment / transaction ID from Billing history or Mollie Dashboard.  
2. **Identify the Auroranexis sales invoice** — `sales_invoices` row linked by `provider_transaction_id` / invoice number (`ANX-YYYY-######`).  
3. **Determine full vs partial refund** — commercial decision; record reason.  
4. **Perform the refund** through the approved Mollie operator mechanism (Dashboard/API). Do not invent a customer self-serve refund path.  
5. **Record the Mollie refund reference** (refund ID, amount, currency, timestamp) in the operator ticket / accounting file.  
6. **Determine whether an accounting correction document is required** (tax adviser / accountant). Refund alone may be insufficient for VAT books.  
7. **Create / manually record a credit note or corrected invoice** via the approved accounting process (external books or future product). **Not automated in-product today.**  
8. **Link the correction to the original invoice number** (reference original `ANX-…` on the credit note).  
9. **Preserve the original issued invoice** — do not mutate net/VAT/gross/tax notes/buyer/seller snapshots on issued rows.  
10. **Record the commercial / tax reason** (duplicate charge, billing error, goodwill, etc.).  
11. **Communicate to the customer** via `support@auroranexis.com` (refund confirmation ≠ credit-note PDF unless separately issued).  
12. **Retain accounting evidence** for statutory retention (payment + invoice + refund + correction docs).

---

## Product constraints (engineering)

- Issued `sales_invoices` are **immutable** for money/tax presentation facts (no silent rewrite path).  
- `AUTOMATED_CREDIT_NOTES = NO`  
- Current launch path: **MANUAL_ACCOUNTING_PROCESS**  
- Customer Refund Policy: requests via support; cancellation ≠ refund  

---

## Do not claim

- Refund automatically voids the Auroranexis invoice  
- Mollie issues the Auroranexis legal sales invoice  
- Refund automatically creates a credit note  

---

## Related surfaces

- Public: `/refund-policy`, `/terms`  
- Engineering: `src/lib/billing/sales-invoice.ts`, Mollie operator refund tooling  
- Sign-off: `docs/p1-002-external-signoff-dossier.md`
