# International Transfer Review

**Status:** `PARTIAL` / `COUNSEL_REVIEW_REQUIRED`  
**Rule:** Never fabricate SCC module numbers, adequacy decisions, or Transfer Impact Assessments (TIAs).  
**Baseline SHA:** `1fe7a59085060fa67d679bc70f702ef0106a8de7`  
**Inventory source:** `src/lib/company/subprocessors-inventory.ts`  
**DPA Annex IV:** `src/lib/company/dpa-document.ts` (states SCCs “where required”; details on request)

Public DPA / Privacy may reference safeguards; **repository evidence does not include completed per-provider TIA files or executed SCC copies.**

---

## Classification key

| Code | Meaning |
|------|---------|
| `ACTIVE` | Used on configured production path for the Service |
| `OPTIONAL` | Used only when env-configured / consented / feature-enabled (`OPTIONAL_CONFIGURABLE`) |
| `CODE_SUPPORTED_ONLY` | Adapter/path exists; not treated as active production dependency (`CODE_SUPPORTED_NOT_ACTIVE`) |
| `UNKNOWN_PRODUCTION_STATUS` | Cannot prove live enablement from repo alone (operator must confirm env) |

For OPTIONAL / CODE_SUPPORTED providers, production enablement is env-dependent → often `UNKNOWN_PRODUCTION_STATUS` for live transfer risk until operator attests.

---

## Provider inventory

| Provider | Classification | Typical data | Location wording in inventory | Transfer notes (engineering only) |
|----------|----------------|--------------|-------------------------------|-----------------------------------|
| **Vercel** | ACTIVE | Request metadata, runtime, logs as configured | “As configured for the production deployment” | May involve non-EEA infrastructure depending on project config — **operator confirm region/account settings**; no TIA in repo |
| **Supabase** | ACTIVE | Account, workspace, auth, operational data | “EU-capable regions (as configured for the production project)” | Prefer EU project evidence; **do not invent DC**; no TIA in repo |
| **Mollie** | ACTIVE | Payment / billing transaction data | “EEA (Mollie as PSP)” | EEA PSP transparency listing; role `PSP_INDEPENDENT` — counsel confirm transfer characterisation |
| **Sentry** | OPTIONAL (+ often UNKNOWN_PRODUCTION_STATUS until env attested) | Error reports, stack traces, limited request context (scrubbing claimed) | “As configured for the monitoring project” | US/third-country possible depending on org plan — **no fabricated SCC** |
| **PostHog** | OPTIONAL | Pseudonymous product events (analytics consent) | “As configured (EU host preferred when set)” | EU host preferred when set — operator must confirm host |
| **Plausible** | OPTIONAL | Pseudonymous pageviews (analytics consent) | “As configured for the Plausible site” | Confirm hosting region if enabled |
| **Microsoft Clarity** | OPTIONAL | Pseudonymous session/interaction (analytics consent) | “As configured for the Clarity project” | Microsoft stack — transfer tool TBD by counsel if enabled |
| **GA4** | OPTIONAL | Pseudonymous marketing/conversion events | “As configured for the GA4 property” | Google — classic transfer diligence if Measurement ID live |
| **OpenAI** | OPTIONAL | Prompts / AI feature content when enabled | “As configured for the AI provider integration” | Optional generative AI — high counsel priority if production keys live |
| **Anthropic** | CODE_SUPPORTED_ONLY | Prompts if configured | “As configured if enabled” | Not treated active unless credentials configured |
| **Azure OpenAI** | CODE_SUPPORTED_ONLY | Prompts if configured | “As configured if enabled” | Region depends on Azure deployment if ever enabled |
| **Resend** | OPTIONAL | Transactional email content | “As configured for the Resend project” | Alternate to SMTP |
| **SMTP / STRATO** | ACTIVE | Transactional email | “e.g. STRATO” as configured | German SMTP path preferred in inventory notes |
| **Postmark** | CODE_SUPPORTED_ONLY | Transactional email | “As configured if enabled” | Adapter in `src/lib/email/provider/postmark.ts` |
| **Mailgun** | CODE_SUPPORTED_ONLY | Transactional email | “As configured if enabled” | Adapter in `src/lib/email/provider/mailgun.ts` |
| **Amazon SES** | CODE_SUPPORTED_ONLY | Transactional email | “As configured if enabled” | `ses.ts` prefers SMTP relay / SDK config messaging |

---

## What exists vs what does not

| Artifact | Status |
|----------|--------|
| Public transfer clause (DPA §13 + Annex IV) | EXISTS — high-level |
| Subprocessor location wording | EXISTS — conservative / “as configured” |
| Per-provider SCC PDFs / module selection | **NOT in repo** — do not invent |
| Per-provider TIAs | **NOT in repo** — do not invent |
| Adequacy decision reliance memos | **NOT in repo** |
| Operator attestation of live env for OPTIONAL providers | `OPERATOR_REVIEW_REQUIRED` |

## Counsel questions (narrow)

1. For ACTIVE providers (Vercel, Supabase, Mollie, SMTP/STRATO), which transfer tools are required given the **actual** production regions?  
2. May Annex IV remain “SCCs on request” for a sole-prop B2B SaaS, or must a schedule of tools be published?  
3. For OPTIONAL analytics/AI/monitoring, is consent + DPA + inventory enough until enabled, or must TIAs exist before any enablement?  
4. How should Mollie (PSP_INDEPENDENT) be treated for Chapter V purposes vs Art. 28 subprocessors?

## Operator action (non-engineering)

Record live env attestation (enabled Y/N + region/host) for: Sentry, GA4, PostHog, Plausible, Clarity, OpenAI, Resend — store outside this repo if secrets-sensitive.
