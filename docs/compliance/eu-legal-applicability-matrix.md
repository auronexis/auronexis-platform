# EU Legal Applicability Matrix

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Status:** Engineering inventory for counsel review — not a legal opinion  
**Entity:** Auroranexis AI Solutions · **Product:** Auroranexis B2B SaaS  

Confidence values: `CONFIRMED` | `LIKELY` | `POSSIBLE` | `UNLIKELY` | `NOT APPLICABLE` | `LEGAL REVIEW REQUIRED`

---

## A. Cyber Resilience Act — Regulation (EU) 2024/2847

| Field | Assessment |
|-------|------------|
| **Applies?** | POSSIBLE — LEGAL REVIEW REQUIRED |
| **Confidence** | POSSIBLE |
| **Why** | Auroranexis is commercial software made available to EU customers. CRA covers “products with digital elements” placed/made available on the Union market, including certain remote data processing integral to such products (Recital 11; Art. 3 definitions — ARTICLE TO VERIFY for exact definition text). Recital 12 states cloud/SaaS models are addressed under NIS2 for qualifying cloud service providers, and that cloud solutions are CRA “remote data processing” only when they meet the CRA definition tied to a product with digital elements. Pure browser SaaS without a separately placed digital product is therefore **not automatically CRA-in-scope**. Counsel must decide whether the commercial SaaS offering constitutes a CRA product with digital elements. |
| **Auroranexis role** | Potential **manufacturer** / economic operator **if** CRA applies; otherwise supplier under other regimes |
| **Effective dates (EUR-Lex verified)** | Entered into force on the 20th day after OJ publication (Art. 71(1)). Application: **11 Dec 2027** generally; **Article 14** reporting from **11 Sep 2026**; Chapter IV conformity-assessment bodies from **11 Jun 2026** (Art. 71(2)–(3); Recital 126). |
| **Relevant obligations (if in scope)** | Essential cybersecurity requirements; vulnerability handling; coordinated disclosure; actively exploited vulnerability & severe incident reporting (Art. 14); technical documentation; conformity assessment; support period; SBOM-related obligations in Annex I Part II (ARTICLE TO VERIFY detail) |
| **Current readiness** | Partial security/engineering controls exist; CRA-specific manufacturer dossier, CE/DoC process, ENISA single-reporting readiness **MISSING** |
| **Main gaps** | Scope decision; vulnerability reporting runbook to CSIRT/ENISA platform; support-period policy; SBOM; conformity assessment plan |
| **Legal review required** | YES |
| **Source** | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R2847 |

### CRA provisional product category (if CRA applies)

| Category | Assessment |
|----------|------------|
| Default (non-important / non-critical) | **LIKELY** provisional |
| Important Class I (Annex III) | **UNLIKELY** — core product is MSP/agency operations SaaS; does not match listed Class I core functionalities (identity/PAM, browsers, password managers, VPN, SIEM, OS, etc.) as product core functionality |
| Important Class II (Annex III) | **UNLIKELY** — not hypervisor/container runtime, firewall/IDS/IPS, or tamper-resistant microcontrollers as core product |
| Critical (Annex IV) | **UNLIKELY** — no match to listed critical categories on current product evidence |
| **Note** | Provisional until legal review. Do not force higher class. |

---

## B. EU AI Act — Regulation (EU) 2024/1689

| Field | Assessment |
|-------|------------|
| **Applies?** | LIKELY (role/risk-tier specific) |
| **Confidence** | LIKELY for some provider/deployer transparency & prohibited-practice screening; high-risk **NOT assumed** |
| **Why** | Product includes optional generative AI features (OpenAI-backed copilot, operational drafting, executive summaries). AI Act applies to providers/deployers of AI systems in the Union. No repository evidence of Annex III high-risk use cases (biometrics, critical infrastructure safety, employment decisions, credit scoring, etc.). |
| **Auroranexis role** | LIKELY **provider** of AI systems integrated in the SaaS; LIKELY **deployer** of third-party models (OpenAI); customer may also be deployer of outputs |
| **Effective dates (EUR-Lex verified)** | Prohibitions/general provisions from **2 Feb 2025**; GPAI provider obligations from **2 Aug 2025** (recital/application schedule); general application **2 Aug 2026** (Art. 113) |
| **Relevant obligations** | Prohibited practices screening; transparency for certain AI interactions; documentation/logging proportionate to risk; GPAI obligations primarily on model providers (OpenAI), not Auroranexis as app integrator — LEGAL REVIEW on “AI system provider” vs integrator |
| **Current readiness** | Partial: server-side AI, usage limits, fallbacks, request logging modules exist; formal AI Act technical documentation / user transparency labeling incomplete |
| **Main gaps** | Formal risk classification memo; user-facing AI disclosure consistency; human-oversight policy; provider vs deployer contract clauses with OpenAI |
| **Legal review required** | YES |
| **Source** | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689 |

---

## C. Product Liability Directive — Directive (EU) 2024/2853

| Field | Assessment |
|-------|------------|
| **Applies?** | LIKELY (as commercial software product regime) |
| **Confidence** | LIKELY that software/SaaS can be a “product”; claim exposure depends on damage to natural persons — LEGAL REVIEW |
| **Why** | Directive expressly includes software (including SaaS supply modes) within “product” (Recital 13; Art. 4(1)). Applies to products placed on the market / put into service **after 9 Dec 2026** (Art. 2). B2B SaaS may still create liability exposure if defective software causes covered damage to natural persons. |
| **Auroranexis role** | LIKELY **manufacturer** of software product |
| **Effective date** | Products after **9 December 2026** |
| **Relevant obligations** | Evidence preservation; defect/update safety; ability to demonstrate development/control of software updates |
| **Current readiness** | Partial release/CI evidence; incomplete defect/known-issue evidence program |
| **Main gaps** | Retention of release artifacts, security patch evidence, AI change evidence, known-defect register |
| **Legal review required** | YES |
| **Source** | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024L2853 |

---

## D. GDPR — Regulation (EU) 2016/679

| Field | Assessment |
|-------|------------|
| **Applies?** | CONFIRMED |
| **Confidence** | CONFIRMED |
| **Why** | Processing of personal data of users (account, roles, emails) and customer-entered operational data in the EU; German controller entity. |
| **Auroranexis role** | CONFIRMED **controller** for platform account/ops data it determines purposes for; LIKELY **processor** for customer-entered client/end-customer data in workspaces — confirm via DPA/roles |
| **Effective date** | In force since 2018 |
| **Relevant obligations** | Lawful basis, transparency, security (Art. 32), DSR, DPIA where required, sub-processors, international transfers, breach notification |
| **Current readiness** | Partial: privacy/DPA/subprocessor pages; GDPR request workflow tables; audit/RLS/RBAC; retention module |
| **Main gaps** | DPIA inventory; RoPA completeness verification; breach notification runbook to authorities; DSR fulfillment automation beyond registry |
| **Legal review required** | YES (roles, transfer mechanisms, DPIA triggers) |
| **Source** | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679 |

---

## E. Data Act — Regulation (EU) 2023/2854

| Field | Assessment |
|-------|------------|
| **Applies?** | POSSIBLE — LEGAL REVIEW REQUIRED |
| **Confidence** | POSSIBLE |
| **Why** | Data Act covers connected products/related services and cloud switching/fairness rules. Auroranexis is not an IoT device manufacturer on current evidence. Cloud switching / data export expectations may still interact with B2B SaaS contracts. Do **not** assume full IoT chapter applicability. |
| **Auroranexis role** | POSSIBLE data processing service provider for switching chapters — LEGAL REVIEW |
| **Effective date** | REQUIRES LEGAL SOURCE VERIFICATION for chapter-specific dates |
| **Relevant obligations** | Switching, export formats, contractual unfairness limits (if in scope) |
| **Current readiness** | Partial audit/evidence exports; no full organization data-portability package verified |
| **Main gaps** | Formal switching/export specification; lock-in assessment |
| **Legal review required** | YES |
| **Source** | REQUIRES LEGAL SOURCE VERIFICATION — EUR-Lex CELEX for 2023/2854 to be cited precisely in Part 2 |

---

## F. NIS2 — Directive (EU) 2022/2555

| Field | Assessment |
|-------|------------|
| **Applies?** | DIRECT entity scope: UNLIKELY / LEGAL REVIEW REQUIRED · Supplier expectations: LIKELY |
| **Confidence** | POSSIBLE for German size/sector qualification; LIKELY as supplier to covered entities |
| **Why** | SaaS/cloud providers can be in scope when size/sector thresholds met. Auroranexis is a sole proprietorship B2B SaaS; **no repository evidence** of essential/important entity designation. Customers may still impose NIS2-aligned contractual security requirements. |
| **Auroranexis role** | POSSIBLE essential/important entity (unconfirmed); LIKELY **supplier** to NIS2 entities |
| **Effective date** | Member State transposition — German implementing law REQUIRES LEGAL SOURCE VERIFICATION |
| **Relevant obligations** | If in scope: risk management, incident reporting, supply-chain security. As supplier: contractual security evidence |
| **Current readiness** | Partial security/DR/incident registry; no NIS2 authority reporting process |
| **Main gaps** | Entity-scope legal opinion; customer security pack; incident notification SLAs |
| **Legal review required** | YES |
| **Source** | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2555 (confirm) — German transposition REQUIRES LEGAL SOURCE VERIFICATION |

---

## G. European Accessibility Act — Directive (EU) 2019/882

| Field | Assessment |
|-------|------------|
| **Applies?** | POSSIBLE — LEGAL REVIEW REQUIRED |
| **Confidence** | POSSIBLE |
| **Why** | EAA covers certain products/services including some digital services; B2B exclusions and SME/microenterprise relief may apply. Auroranexis has WCAG-oriented engineering work but **no legal determination** of EAA direct applicability. |
| **Auroranexis role** | POSSIBLE service provider under EAA if in scope |
| **Effective date** | 28 June 2025 application commonly cited — REQUIRES LEGAL SOURCE VERIFICATION against EUR-Lex/national law for exact service categories |
| **Relevant obligations** | Accessibility requirements, information, conformity where applicable |
| **Current readiness** | Partial WCAG 2.1 AA engineering baseline (`docs/accessibility-audit.md`, a11y helpers, Ch.10 rules) |
| **Main gaps** | Formal EAA applicability opinion; VPAT/ACR; continuous a11y testing evidence |
| **Legal review required** | YES |
| **Source** | REQUIRES LEGAL SOURCE VERIFICATION — EUR-Lex CELEX 32019L0882 |

---

## H. Digital Services Act — Regulation (EU) 2022/2065

| Field | Assessment |
|-------|------------|
| **Applies?** | UNLIKELY for core intermediary/platform obligations |
| **Confidence** | UNLIKELY |
| **Why** | Auroranexis is a B2B operations SaaS, not evidenced as a large online platform/search engine or general hosting intermediary for third-party public content. Limited public marketing/docs surfaces do not alone establish DSA “online platform” status. |
| **Auroranexis role** | POSSIBLE hosting service for customer content inside tenants — LEGAL REVIEW if counsel sees intermediary service |
| **Effective date** | In force (phased) — REQUIRES LEGAL SOURCE VERIFICATION for any residual obligations |
| **Relevant obligations** | Only if intermediary/platform classification applies |
| **Current readiness** | N/A for core DSA packs |
| **Main gaps** | Confirm non-applicability memo |
| **Legal review required** | YES (short confirmatory review) |
| **Source** | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2065 (confirm) |

---

## I. DORA — Regulation (EU) 2022/2554

| Field | Assessment |
|-------|------------|
| **Applies?** | NOT APPLICABLE as direct financial entity on current evidence; CUSTOMER DEPENDENCY POSSIBLE |
| **Confidence** | NOT APPLICABLE (direct) / POSSIBLE (supplier to DORA entities) |
| **Why** | No repository evidence Auroranexis is a financial entity. If banks/insurers/etc. become customers, DORA ICT third-party expectations apply contractually. |
| **Auroranexis role** | POSSIBLE ICT third-party provider to DORA entities |
| **Effective date** | 17 Jan 2025 commonly cited — REQUIRES LEGAL SOURCE VERIFICATION |
| **Relevant obligations** | As supplier: ICT risk, incident, audit, exit/switching evidence on request |
| **Current readiness** | Partial DR/security docs; no DORA-specific pack |
| **Main gaps** | Customer due-diligence pack if targeting financial sector |
| **Legal review required** | YES if pursuing financial customers |
| **Source** | REQUIRES LEGAL SOURCE VERIFICATION — EUR-Lex CELEX 32022R2554 |

---

## J. ePrivacy / German TTDSG–TDDDG cookie & privacy obligations

| Field | Assessment |
|-------|------------|
| **Applies?** | LIKELY (cookies/tracking on public site + auth cookies) |
| **Confidence** | LIKELY |
| **Why** | Marketing analytics (consent-gated) and necessary auth/security cookies are implemented. German rules on terminal equipment information storage/access remain relevant. |
| **Auroranexis role** | Website/service operator |
| **Effective date** | Ongoing |
| **Relevant obligations** | Consent for non-essential cookies/trackers; transparency |
| **Current readiness** | Partial: analytics consent category sinks; cookie policy page; necessary cookies disclosed in legal content |
| **Main gaps** | Counsel review of consent UX vs TTDSG/TDDDG; verify no non-essential load before consent |
| **Legal review required** | YES |
| **Source** | REQUIRES LEGAL SOURCE VERIFICATION — official German legislation portals (TTDSG/TDDDG current citation) |

---

## K. German implementation laws (identifiable from project material)

| Instrument area | Applies? | Confidence | Notes | Legal review | Source |
|-----------------|----------|------------|-------|--------------|--------|
| Impressum / TMG–DDG company disclosure | LIKELY | LIKELY | Imprint page exists with German entity data | YES | REQUIRES LEGAL SOURCE VERIFICATION for current DDG citation |
| BDSG (alongside GDPR) | LIKELY | LIKELY | German controller | YES | REQUIRES LEGAL SOURCE VERIFICATION |
| Consumer withdrawal BGB §§ 312g, 355 (as referenced in refund policy) | POSSIBLE | POSSIBLE | Legal content states B2B primary; consumer rights preserved where mandatory | YES | Project legal content + counsel |
| NIS2 German transposition | POSSIBLE | POSSIBLE | Entity scope unconfirmed | YES | REQUIRES LEGAL SOURCE VERIFICATION |
| Product liability German transposition of Dir. 2024/2853 | LIKELY future | LIKELY | Transposition deadline dynamics — counsel | YES | REQUIRES LEGAL SOURCE VERIFICATION |

---

## Regulatory role matrix (summary)

| Role | Status | Reason | Evidence | Legal review |
|------|--------|--------|----------|--------------|
| Manufacturer (CRA/PLD sense) | POSSIBLE (CRA) / LIKELY (PLD software) | Commercial software producer | SaaS product, company legal pages | YES |
| Provider (AI Act) | LIKELY | Integrates/offers AI features in product | `src/lib/ai/**` | YES |
| Deployer (AI Act) | LIKELY | Uses OpenAI models | OpenAI provider modules; subprocessors page | YES |
| Data controller | CONFIRMED | Determines purposes for account/platform data | Privacy policy; auth; billing identifiers | YES (boundary) |
| Data processor | LIKELY | Processes customer workspace data on instructions | DPA page; multi-tenant CRM data | YES |
| AI provider | LIKELY | See Provider | AI modules | YES |
| AI deployer | LIKELY | See Deployer | OpenAI optional | YES |
| Software producer | CONFIRMED | Builds/ships Auroranexis | Repository, releases | NO |
| Economic operator | POSSIBLE | If CRA/PLD apply | Commercial offering | YES |
| Online service provider | CONFIRMED (factual) / DSA role UNLIKELY | Operates SaaS/website | Production deployment | YES for DSA |
| Subprocessor | NOT APPLICABLE (self) | Auroranexis engages subprocessors | Subprocessors page | NO |
| Supplier to NIS2 entities | LIKELY (contractual) | B2B MSP/agency customers may be covered | Market positioning | YES |
| Supplier to DORA entities | POSSIBLE | Only if financial customers | Not evidenced as current focus | YES if pursued |
