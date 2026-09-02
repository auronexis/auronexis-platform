# AI Act Counsel Review — feature matrix & Art. 50

**Status:** `COUNSEL_REVIEW_REQUIRED`  
**Instrument:** Regulation (EU) 2024/1689  
**Engineering baselines:** [`ai-act-gap-baseline.md`](./ai-act-gap-baseline.md), [`gdpr-ai-act-p1-remediation-report.md`](./gdpr-ai-act-p1-remediation-report.md)  
**Rule:** Do **not** assume high-risk AI. Every row ends with `LEGAL_COUNSEL_CONFIRMATION_REQUIRED`.

Public literacy (not certification): `/docs/ai-literacy` — `src/lib/docs/pages/extras.ts` (`AI_LITERACY_DOC`).  
UI disclosure component: `src/components/ai/ai-disclosure.tsx` (`AiDisclosure`).

---

## Feature matrix

| Feature | Type | Provider (typical) | Inputs | Outputs | May include personal data? | Human review | Autonomous action evidenced? | Disclosure | Art.50 label (eng.) | Likely role (eng.) | Risk class (eng.) | Counsel |
|---------|------|-------------------|--------|---------|----------------------------|--------------|------------------------------|------------|---------------------|--------------------|-------------------|---------|
| Workspace / Client Copilot | GENERATIVE_AI | OpenAI (when enabled) | User questions + tenant ops context | Answers / drafts | Yes if present in context | User reads/uses; safe fallback builders | No unsupervised system actions evidenced | `AiDisclosure` on answer panel | Art.50-style transparency intended | Provider (app) + Deployer (model) | Not assumed high-risk | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |
| Operational AI (risks/incidents) | GENERATIVE_AI | OpenAI | Risk/incident records | Summaries, mitigation/RCA drafts | Yes | Preview/apply (`operational-ai-diff-preview`) | No — user applies | `AiDisclosure` generated/assisted | Art.50-style | Provider + Deployer | Not assumed high-risk | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |
| Report assistant / executive summary generator | GENERATIVE_AI | OpenAI | Report context | Draft sections | Possible | User accepts/edits | No | `AiDisclosure` assisted | Art.50-style | Provider + Deployer | Not assumed high-risk | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |
| Executive intelligence panels | HYBRID | OpenAI for generative slices; deterministic/predictive elsewhere | Metrics / findings | Briefs / findings | Possible | User consumption; verify hints | No autonomous business actions evidenced | `AiDisclosure` where generative | Art.50-style on generative surfaces | Mixed | Not assumed high-risk | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |
| Knowledge hub generation | GENERATIVE_AI | OpenAI + retrieval | Knowledge artifacts / prompts | Generated knowledge text | Possible | User review | No | `AiDisclosure` generated | Art.50-style | Provider + Deployer | Not assumed high-risk | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |
| Automation NL translation | GENERATIVE_AI | OpenAI (when used) | Natural language | Workflow draft | Possible | Review before enable | No auto-enable evidenced | `AiDisclosure` assisted/generated | Art.50-style | Provider + Deployer | Not assumed high-risk | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |
| Insights / client-success helpers | HYBRID | Varies — treat generative slices as AI-assisted | Analytical context | Insights / drafts | Possible | User | Not evidenced | Per surface | Confirm coverage | Mixed | Not assumed high-risk | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |
| Public API `/api/v1/ai` | GENERATIVE_AI | Platform AI stack | API caller payloads | Model outputs | Depends on caller | Caller responsibility | Depends on caller | API consumer docs / literacy | Confirm Art.50 to API consumers | Provider + Deployer | LEGAL_COUNSEL_CONFIRMATION_REQUIRED | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |
| Deterministic metrics / rules / SQL aggregates | DETERMINISTIC / RULE_BASED | N/A (app logic) | Workspace data | Scores/tables | Yes (ops data) | N/A | Rule execution only | Literacy: not Art.50 generative | N/A if non-generative | N/A / limited | Not AI Act generative transparency focus | LEGAL_COUNSEL_CONFIRMATION_REQUIRED (boundary) |
| Predictive scoring (health/risk/retention signals) | HYBRID / deterministic heuristics | App models/heuristics | Operational signals | Rankings / scores | Possible | Operator interpretation | No sole legal decision product purpose evidenced | Literacy distinguishes from generative | Confirm if “AI system” | Deployer?/Provider? | Not assumed high-risk / Annex III | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |
| Anthropic / Azure OpenAI paths | GENERATIVE_AI (CODE_SUPPORTED) | Anthropic / Azure if configured | Same class as OpenAI | Same | Same | Same | Same | Same component if wired | Same | Same | CODE_SUPPORTED_NOT_ACTIVE unless env live | LEGAL_COUNSEL_CONFIRMATION_REQUIRED |

**STUB note:** Anthropic resolution may fall back to mock output when not fully configured (`resolve-domain-provider.ts` / incident-risk analysis paths) — treat as incomplete provider integration, not a separate customer-facing model brand claim.

---

## Explicit non-findings (from baseline)

No repository evidence of remote biometric ID, critical-infrastructure safety components, employment decisioning as product purpose, credit scoring / essential benefits decisions, real-time public emotion recognition, or unrestricted social scoring. **Absence ≠ legal clearance.**

---

## Art. 50 — narrow legal questions + technical evidence

**Do not ask counsel “are we compliant?”** Ask verifiable scope questions:

### Q-Art50-1 — Scope of “AI system” interaction disclosure

- **Question:** Which authenticated generative surfaces must carry Art. 50 machine-interaction transparency for this B2B SaaS?  
- **Technical evidence:** Shared `AiDisclosure` (`assisted` / `generated` copy) wired on Copilot, operational AI, reports, knowledge, automation, executive intelligence panels (see component imports under `src/components/**`). Literacy states only generative surfaces need Art.50-style UI labels.

### Q-Art50-2 — Wording sufficiency

- **Question:** Are labels “AI-assisted” and “AI-generated · Verify before use” (+ optional human-review hints) legally sufficient, or is deeper notice (provider, model, limitations) required in-product?  
- **Technical evidence:** `DISCLOSURE_COPY` in `ai-disclosure.tsx`; deeper explanation on `/docs/ai-literacy`.

### Q-Art50-3 — API consumers

- **Question:** What disclosure is required for `/api/v1/ai` programmatic access?  
- **Technical evidence:** Route/capability documented in AI Act baseline; caller oversight not assumed by Auroranexis.

### Q-Art50-4 — Non-generative “intelligence”

- **Question:** Must deterministic/predictive dashboards carry Art. 50 labels if branded “intelligence”?  
- **Technical evidence:** Literacy explicitly separates generative vs deterministic vs predictive; many findings do not call LLMs.

### Q-Art50-5 — Provider/deployer duties split

- **Question:** For OpenAI-backed features, which Art. 50 / related duties fall on Auroranexis vs the model provider?  
- **Technical evidence:** Optional OpenAI integration; subprocessors list OpenAI as OPTIONAL_CONFIGURABLE; GPAI model provider role assessed **UNLIKELY** for Auroranexis (baseline).

### Q-Art50-6 — Synthetic content marking

- **Question:** Does any output require machine-readable synthetic-content marking beyond UI labels?  
- **Technical evidence:** Presentational UI labels only; no claim of C2PA/synthetic watermarking in engineering pack.

---

## Classification posture (engineering)

| Topic | Engineering posture |
|-------|---------------------|
| High-risk Annex III | **Not assumed** |
| Prohibited practices | Screening record still a gap (baseline) |
| GPAI provider | UNLIKELY |
| Transparency diligence | LIKELY / POSSIBLE — P1-01 FIXED engineering |
| Human oversight | Preview/apply patterns for operational writes |

**All legal classifications:** `LEGAL_COUNSEL_CONFIRMATION_REQUIRED`.
