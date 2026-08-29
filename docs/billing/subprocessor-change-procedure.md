# Subprocessor Change Procedure

**Audience:** Operator · legal  
**Inventory source:** `src/lib/company/subprocessors-inventory.ts`  
**Public page:** `/subprocessors`  
**DPA Annex III:** built from the same inventory (`src/lib/company/dpa-document.ts`)  
**Status:** Lightweight operator procedure — not an automated notification platform  

**LEGAL_COUNSEL_SIGNOFF_REQUIRED** for notice periods and objection handling on enterprise deals.

---

## When to use

Any material addition, replacement, or removal of a sub-processor / listed service provider that processes personal data for the Auroranexis Service.

---

## Steps

1. **Update the inventory** in `src/lib/company/subprocessors-inventory.ts` (provider, purpose, role, region wording only if known, always/conditional).  
2. **Bump** `SUBPROCESSORS_DOCUMENT_VERSION` and set `SUBPROCESSORS_EFFECTIVE_DATE`.  
3. **Determine affected customers** (all Controllers under the standard DPA / Terms, plus any enterprise addenda with stricter notice).  
4. **Send advance notification** where the contractual DPA requires it (workspace admins / legal contact). Keep notice factual — no fake certifications.  
5. **Preserve evidence of notice** (sent date, version, channel, audience) in the operator compliance file.  
6. **Publish** the updated list via normal deploy (public `/subprocessors` + DPA Annex III regenerate from inventory).  

---

## Do not

- Invent data-centre regions  
- Call Mollie “Merchant of Record”  
- Broaden service_role or weaken RLS for “notification” features  
- Skip version bumps when the published list changes  

---

## Related contacts

- Legal: `legal@auroranexis.com`  
- Support: `support@auroranexis.com`
