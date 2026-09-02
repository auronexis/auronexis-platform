# Subprocessor Counsel Review

**Status:** `ENGINEERING_COMPLETE` (inventory sync) / `COUNSEL_REVIEW_REQUIRED` (legal characterisation & notice)  
**Canonical inventory:** `src/lib/company/subprocessors-inventory.ts`  
**Version:** `subprocessors-2026-09-02-v2` · **Effective:** `2026-09-02`  
**Public page:** `/subprocessors`  
**DPA Annex III:** built from the same inventory (`dpa-document.ts`)  
**Change procedure:** `docs/billing/subprocessor-change-procedure.md`  
**DPA status preserved:** `READY_FOR_EXTERNAL_LEGAL_REVIEW`

---

## Reconciliation: public page / DPA / code

| Source | Alignment |
|--------|-----------|
| `/subprocessors` | Renders inventory |
| DPA Annex III | `formatSubprocessorInventoryPlainText()` from same inventory |
| Email providers in code | `src/lib/email/provider/*` (smtp, resend, postmark, mailgun, ses) |
| AI providers in code | OpenAI primary; Anthropic/Azure paths code-supported |
| Analytics / Sentry | Consent-gated / optional modules under `src/lib/analytics/**`, monitoring config |

**Historical contradiction (docs only):** older packs (`docs/p1-002-*.md`, some certification audits) noted Resend listed while SMTP was production — **mitigated** in inventory by ACTIVE SMTP/STRATO + OPTIONAL Resend + CODE_SUPPORTED others (P1-06 MITIGATED). Prefer inventory over older docs.

**Stale FastSpring references** in some compliance README/evidence rows — runtime billing provider is Mollie; inventory lists Mollie as ACTIVE PSP.

---

## Inventory by activation

### ACTIVE

| Provider | Role | Counsel focus |
|----------|------|---------------|
| Supabase | PROCESSOR | Hosting/auth/DB DPA & region |
| Vercel | PROCESSOR | Hosting transfer / DPA |
| Mollie | PSP_INDEPENDENT | Confirm **not** MoR; PSP vs Art. 28 subprocessor treatment |
| SMTP / STRATO | PROCESSOR | DE email path; processor terms |

### OPTIONAL / CONFIGURABLE

| Provider | Role | Counsel focus |
|----------|------|---------------|
| Resend | CONDITIONAL_PROCESSOR | When enabled vs SMTP |
| Sentry | CONDITIONAL_PROCESSOR | Cookie/SDK + transfer + scrubbing adequacy |
| GA4 | OPTIONAL_ANALYTICS | Consent + transfer |
| PostHog | OPTIONAL_ANALYTICS | EU host preference attestation |
| Plausible | OPTIONAL_ANALYTICS | Enablement attestation |
| Microsoft Clarity | OPTIONAL_ANALYTICS | Session replay sensitivity |
| OpenAI | CONDITIONAL_PROCESSOR | AI DPA/SCC; customer instructions |

### FUTURE / CODE-SUPPORTED (NOT ACTIVE)

| Provider | Role | Counsel focus |
|----------|------|---------------|
| Postmark | CONDITIONAL_PROCESSOR | Disclose as potential only — OK? |
| Mailgun | CONDITIONAL_PROCESSOR | Same |
| Amazon SES | CONDITIONAL_PROCESSOR | Same |
| Anthropic | CONDITIONAL_PROCESSOR | Same |
| Azure OpenAI | CONDITIONAL_PROCESSOR | Same |

---

## Counsel questions per provider (compressed)

1. **Supabase / Vercel:** Acceptable location wording (“as configured / EU-capable”) without naming exact DCs?  
2. **Mollie:** Keep as transparency PSP listing outside pure Art. 28 “subprocessor,” or reclassify?  
3. **SMTP/STRATO vs Resend:** Is dual listing clear enough for customers?  
4. **Sentry:** Legitimate interest vs consent for error SDK under TTDSG–TDDDG?  
5. **GA4 / Clarity / PostHog / Plausible:** Any must-drop providers for DE B2B marketing site risk appetite?  
6. **OpenAI:** Minimum contractual + disclosure bar before optional AI enablement?  
7. **CODE_SUPPORTED providers:** May they appear on the public list before production use, or only when activated?  
8. **Notice period:** Is public-list update + “reasonable advance notice” enough for general authorization under §12 DPA?

## Operator attestation needed

Confirm production env enablement Y/N for each OPTIONAL row; store attestation with inventory version. Do not put secrets in git.
