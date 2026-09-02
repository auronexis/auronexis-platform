# Legal Claims Register — public / marketing statements

**Status:** `COUNSEL_REVIEW_REQUIRED`  
**Rule:** Inventory only. **Do NOT change public copy** in this pack.  
**Sources:** `src/lib/company/legal-content.ts`, `src/lib/company/dpa-document.ts`, `src/lib/marketing/content.ts`, `src/lib/marketing/faq-content.ts`, `src/lib/docs/pages/extras.ts`

### Rating key

| Rating | Meaning |
|--------|---------|
| `PROVEN` | Engineering/runtime evidence supports the claim as worded |
| `CONDITIONALLY_SUPPORTED` | True only under stated conditions / configuration |
| `COUNSEL_REVIEW` | Legal characterisation or risk wording needs counsel |
| `REMOVE_IF_UNVERIFIED` | Should be removed or rewritten if counsel/operator cannot verify |

---

## Register

| # | Surface | Claim (paraphrased) | Rating | Evidence / note |
|---|---------|---------------------|--------|-----------------|
| 1 | Security Policy / FAQ | Encryption in transit (TLS) | `PROVEN` | App served over HTTPS/TLS; Security Policy text |
| 2 | Security Policy / FAQ | Provider-managed encryption at rest as configured; **no** extra app-layer at-rest claim | `CONDITIONALLY_SUPPORTED` | Depends on Supabase/Vercel project config — wording carefully limited |
| 3 | Privacy | Connector/integration tokens “stored encrypted” | `COUNSEL_REVIEW` / `CONDITIONALLY_SUPPORTED` | Confirm crypto implementation vs “encrypted” marketing verb |
| 4 | Security / marketing | Align with ISO 27001 principles; **no formal certification claimed** | `PROVEN` (as negative claim) | Explicit non-certification language in FAQ/Security |
| 5 | Marketing compliance frameworks | SOC 2 / ISO / GDPR rows describe readiness workflows; not certification | `PROVEN` (as qualified) | `PLAN_COMPARISON` / FAQ deny certification claims |
| 6 | FAQ | Platform supports DSR tracking, retention **simulation**, DPA draft for external legal review — **not** “your org is GDPR-compliant” | `PROVEN` | FAQ GDPR answer |
| 7 | DPA Annex II | Lists TOMs including TLS, RBAC, tenant isolation, audit logging, backups | `CONDITIONALLY_SUPPORTED` | Code/docs support controls; backups/DR largely documented |
| 8 | DPA §13 / Annex IV | SCCs and supplementary measures “where required” | `COUNSEL_REVIEW` | **No TIA/SCC pack in repo** — risk of overclaim if read as completed diligence |
| 9 | Privacy / Terms | B2B only (§ 14 BGB entrepreneurs) | `COUNSEL_REVIEW` | Product framing; counsel confirm |
| 10 | Privacy / Terms / DPA | Customer typically controller; Auroranexis processor for workspace PD | `COUNSEL_REVIEW` | Dual-role model — standard but needs counsel OK |
| 11 | Subprocessors | Inventory ACTIVE / OPTIONAL / CODE-SUPPORTED | `PROVEN` (engineering) | `subprocessors-inventory.ts` |
| 12 | Subprocessors / billing | Mollie PSP only; not MoR | `PROVEN` (engineering intent) | Inventory notes + billing modules — counsel confirm legal characterisation |
| 13 | Cookies | Essential vs consent-gated analytics/marketing | `CONDITIONALLY_SUPPORTED` | Consent banner architecture; live tags depend on env |
| 14 | AI literacy | Not a training certificate / compliance badge | `PROVEN` | Explicit callouts |
| 15 | AI UI | “AI-assisted” / “AI-generated · Verify before use” | `PROVEN` (presence) | `AiDisclosure` — Art.50 **legal sufficiency** = `COUNSEL_REVIEW` |
| 16 | Privacy retention | Must not claim automatic deletion | `PROVEN` alignment target | Retention module simulation-only; P1-07 |
| 17 | Security | Vulnerability disclosure / security@ contact | `PROVEN` | `security.txt` route + CVD pages |
| 18 | Older docs / stale | FastSpring as **current** active MoR in internal compliance rows | `REMOVE_IF_UNVERIFIED` → **REMEDIATED 2026-09-02** (`CURRENT_FALSE=0`); historical FastSpring MoR era remains labeled HISTORICAL_ONLY | See operator execution Phase 12 + [`p1-002-live-billing-tax-gate-2026-09-02.md`](./p1-002-live-billing-tax-gate-2026-09-02.md); public inventory Mollie PSP / Auroranexis seller |
| 19 | Marketing “encryption” short bullets | Enterprise content encryption bullets | `CONDITIONALLY_SUPPORTED` | Align with Security Policy nuance |
| 20 | Compliance dashboard scores | Maturity % / framework readiness | `PROVEN` as **gap analysis only** | `docs/compliance.md` warns not SOC/ISO/GDPR certification |

---

## Counsel priorities

1. Soften or footnote DPA SCC wording if TIAs are not ready (`#8`).  
2. Verify “tokens stored encrypted” (`#3`).  
3. Confirm controller/processor + Mollie PSP characterisations (`#10`, `#12`).  
4. Confirm Art. 50 label sufficiency (`#15`) separately from presence of labels.

**No public copy was modified by this register.**
