# AI Act Gap Baseline

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Instrument:** Regulation (EU) 2024/1689  
**Source:** https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689  
**Rule:** Do **not** assume high-risk AI. Classifications below are engineering assessments pending legal review.

Key dates (EUR-Lex): prohibitions from **2 Feb 2025**; GPAI provider obligations from **2 Aug 2025** (primarily model providers); general application **2 Aug 2026**.

---

## AI feature inventory (from repository)

### 1. Workspace / Client Copilot
| Field | Evidence-based content |
|-------|------------------------|
| Feature | Conversational copilot for workspace/client questions, summaries, risk/incident explanation (`src/lib/ai/copilot/**`, `/copilot`) |
| Provider/model | OpenAI via `src/lib/ai/providers/openai.ts` / server config; kill-switch via AI provider config |
| Purpose | Decision-support Q&A and drafting over tenant operational context |
| Customer-facing? | Yes (authenticated product UI) |
| Generative? | Yes |
| Decision-support? | Yes |
| Autonomous action? | No evidence of unsupervised system actions; generates answers with fallbacks (`buildSafeCopilotFallback`) |
| Human review? | User reads/uses outputs; no autonomous workflow execution evidenced |
| Data categories | Org operational context (clients, risks, incidents, reports summaries) — may include personal data entered by customers |
| Logging | Usage recording + AI metrics/request logging modules |
| User disclosure | Partial / inconsistent — LEGAL REVIEW of UI copy |
| Fallback | Safe fallback builders when parse/provider fails |
| Risk (engineering) | Incorrect advice influencing customer operations; data leakage via prompts if misconfigured |
| Likely AI Act role | Provider of AI system (app) + Deployer of third-party model — LEGAL REVIEW REQUIRED |
| Likely risk category | **Not assumed high-risk**; appears limited decision-support tooling — LEGAL REVIEW REQUIRED vs Annex III |
| Transparency obligation possibility | POSSIBLE / LIKELY |
| Human oversight possibility | LIKELY (keep human-in-the-loop; no autonomous legal/employment decisions) |
| Documentation gap | Formal system description, instructions for use, logging retention policy |

### 2. Operational AI (risks / incidents drafting)
| Field | Evidence-based content |
|-------|------------------------|
| Feature | Generate summaries, mitigation plans, RCA drafts, customer updates (`src/lib/ai/operational/**`) |
| Provider/model | OpenAI (same stack) |
| Purpose | Drafting assistance for risk/incident fields |
| Customer-facing? | Yes (authenticated) |
| Generative? | Yes |
| Decision-support? | Yes |
| Autonomous action? | Diff/preview patterns exist (`operational-ai-diff-preview.tsx`); user applies content |
| Human review? | Yes — preview/apply pattern |
| Data categories | Risk/incident records |
| Logging | Usage + generation metrics |
| User disclosure | Partial |
| Fallback | Validation via `validateAIOutput` / error paths |
| Risk | Inaccurate RCA/mitigation text accepted by users |
| Likely role | Provider + Deployer — LEGAL REVIEW REQUIRED |
| Likely risk category | Not assumed high-risk — LEGAL REVIEW REQUIRED |
| Transparency / oversight | POSSIBLE / LIKELY |
| Documentation gap | Oversight SOP; prohibited-use screening |

### 3. Executive intelligence / executive summary
| Field | Evidence-based content |
|-------|------------------------|
| Feature | Executive brief / summary generation (`src/lib/ai/executive-summary/**`, executive intelligence modules) |
| Provider/model | OpenAI stack |
| Purpose | Management summaries |
| Customer-facing? | Yes (authenticated) |
| Generative? | Yes |
| Decision-support? | Yes |
| Autonomous action? | No evidence of autonomous business actions |
| Human review? | User consumption |
| Data categories | Aggregated workspace metrics/context |
| Logging | Present in AI core observability |
| Disclosure / fallback | Partial / present |
| Risk | Misleading executive narrative |
| Classification | Not assumed high-risk — LEGAL REVIEW REQUIRED |

### 4. Knowledge-influenced AI
| Field | Evidence-based content |
|-------|------------------------|
| Feature | Knowledge search influencing prompts (`src/lib/ai/knowledge/**`) |
| Provider/model | Retrieval + OpenAI generation |
| Purpose | Ground answers in workspace knowledge artifacts |
| Customer-facing? | Yes |
| Generative? | Yes (generation); retrieval non-generative |
| Decision-support? | Yes |
| Autonomous action? | No |
| Human review? | Yes |
| Risk | Stale/incorrect knowledge injection |
| Classification | Not assumed high-risk — LEGAL REVIEW REQUIRED |

### 5. Public API AI route
| Field | Evidence-based content |
|-------|------------------------|
| Feature | `/api/v1/ai` route exists |
| Provider/model | Platform AI stack |
| Purpose | Programmatic AI access for authorized API users |
| Customer-facing? | API customers |
| Generative? | Yes (capability) |
| Autonomous action? | Depends on caller — Auroranexis should not assume caller oversight |
| Risk | Customer misuse; logging/accountability |
| Classification | LEGAL REVIEW REQUIRED (transparency to API consumers) |

### 6. Insights / client-success AI helpers
| Field | Evidence-based content |
|-------|------------------------|
| Feature | Insights and client-success AI query modules under `src/lib/ai/insights/**`, `src/lib/ai/client-success/**` |
| Purpose | Analytical assistance |
| Generative? | Varies by module — treat as AI-assisted analytics |
| Autonomous action? | Not evidenced |
| Classification | Not assumed high-risk — LEGAL REVIEW REQUIRED |

---

## Explicit non-findings (important)

Repository evidence does **not** show:

- Remote biometric identification
- Critical infrastructure safety components
- Employment/recruitment decisioning as a product purpose
- Credit scoring / essential benefits decisions
- Real-time public emotion recognition
- Unrestricted social scoring

Therefore: **high-risk classification is not asserted**. Absence of evidence is not a legal clearance.

---

## Role summary

| Role | Status | Notes |
|------|--------|-------|
| AI system provider (Auroranexis features) | LIKELY | Integrates AI into SaaS offering |
| AI deployer (of OpenAI models) | LIKELY | Uses third-party models under config |
| GPAI model provider | UNLIKELY | No evidence Auroranexis trains/publishes GPAI models |
| Customer as deployer of outputs | POSSIBLE | Customers may rely on drafts in their operations |

---

## Gap baseline

| Gap | Priority | Action (later parts / legal) |
|-----|----------|------------------------------|
| Signed risk classification memo | HIGH | Counsel + product |
| Uniform AI disclosure in UI/API | MEDIUM | Product copy + docs |
| Human oversight policy | MEDIUM | Document preview/apply as mandatory for operational writes |
| Prohibited practices screening record | HIGH | Legal checklist |
| Training/data governance for prompts | MEDIUM | Minimize personal data in prompts; retention rules |
| Provider contractual diligence (OpenAI) | HIGH | DPA/SCC/status review |
| Public compliance claims | N/A | **Forbidden** until verified |

---

## Verdict for Part 1

AI Act applicability: **LIKELY for transparency/provider-deployer diligence; high-risk not assumed**.  
Status: **BASELINE ONLY — LEGAL REVIEW REQUIRED** before any customer-facing AI Act statements.
