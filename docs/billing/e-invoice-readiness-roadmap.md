# E-Invoice Readiness Roadmap

**Audience:** Tax adviser · engineering · operator  
**Status:** ROADMAP ONLY — **NOT IMPLEMENTED** for structured formats  
**EXTERNAL_TAX_REVIEW_REQUIRED / TAX_ADVISER_SIGNOFF_REQUIRED**

**Disclaimer:** Not legal advice. Obligation timelines vs turnover must be confirmed by a German tax adviser against official BMF / UStG sources. Do not treat engineering scaffold as EN 16931 compliance.

---

## Current factual state

| Capability | Status |
|------------|--------|
| PDF sales invoice (`sales_invoices` → PDF/HTML) | **IMPLEMENTED** |
| XRechnung XML | **NO** |
| ZUGFeRD | **NO** |
| EN 16931 structured output | **NO** |
| Peppol / network delivery | **NO** |
| Receiving capability (inbound e-invoice) | **NOT IMPLEMENTED** in product |
| Domain scaffold toward future profiles | Present in `src/lib/billing/e-invoice.ts` — **XML generator deferred** (`GENERATOR_DEFERRED`); no fake compliant XML |

---

## Target technical direction (future)

1. Keep Auroranexis as invoice issuer (seller) with Mollie as PSP only.  
2. When tax adviser confirms obligation/timeline: implement maintained EN 16931 profile (XRechnung and/or ZUGFeRD) from existing seller/buyer/tax snapshots.  
3. Prefer a maintained library over hand-rolled XML.  
4. Do not claim compliance until generator + validation evidence exist.

---

## Operator interim

Until structured e-invoice is implemented and signed off:

- Issue **PDF** sales invoices only.  
- If a customer requires structured formats early: handle via **manual / accounting** process outside the product (or defer until engineering delivery).  
- Do **not** enable LIVE charging based on this roadmap alone.

---

## Related

- `src/lib/billing/e-invoice.ts`  
- `docs/p1-002-external-signoff-dossier.md`
