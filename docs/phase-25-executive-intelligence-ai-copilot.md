# Phase 25 — Executive Intelligence & AI Operations Copilot

## Architecture Reused

| System | Reuse |
|--------|-------|
| Phase 12 intelligence | `getExecutiveIntelligence`, dashboard executive panels |
| Phase 23 adoption | `buildAdoptionSnapshot`, period metrics |
| Phase 24 customer success | `buildCustomerSuccessPortfolio`, priority queue |
| AI provider | `resolveAIProvider`, usage limits, `recordAIUsageEvent` |
| Operational snapshot | `buildOperationalSnapshot` (now React `cache()` wrapped) |
| Copilot patterns | Structured JSON validation, redaction, fallback |

## Domain (`src/lib/executive-intelligence/`)

Centralized executive intelligence with evidence-backed findings, period comparison, deterministic briefing, and optional AI narrative enrichment.

## Evidence Model

Every finding includes `IntelligenceEvidence` with `sourceType`, `sourceKey`, `label`, `value`, `observedAt`, `route`. High/critical findings require evidence.

## Change Detection

Tolerance thresholds: moderate ≥2 absolute or ≥15%, major ≥5 absolute or ≥30%. Zero baselines use absolute thresholds only.

## Anomaly Rules

Threshold-based: risk spike (+3), incident spike (+2), report drop (40% from baseline ≥2), overdue tasks (+3), monitoring failures (+2), adoption decline (-10 points), critical client increase.

## Priority Client Engine

Merges Phase 12 `ClientPriorityResult` with Phase 24 customer success queue. Deterministic score boost for critical health, overdue tasks, incidents, risks. Max 25 clients.

## Deterministic Briefing

Always available without AI. Sections: executive summary, improvements, deteriorations, priority clients, recommended actions.

## AI Provider

Reuses `resolveAIProvider`. Missing key → deterministic fallback. Rate limited per org/user. Structured output validated with Zod. Invalid output → fallback.

## Redaction

Emails, tokens, Stripe IDs, bearer tokens redacted before AI prompts.

## Database

`executive_intelligence_briefings` stores snapshot JSON, deterministic narrative, optional AI narrative, generation metadata.

## RBAC

`executive_intelligence.read`, `.generate`, `.refresh`, `.export`, `.manage`

## Routes

- `/intelligence` — full executive intelligence hub
- Dashboard compact panel with priority ordering after activation/adoption/customer success

## Analytics

Consent-gated events for page views, briefing generation, fallback, evidence views.

## Limitations

- Report draft export returns copyable text; user creates draft via Reports → New
- AI narrative requires `ai_report_assistant` plan feature
- Migration must be applied in Supabase before briefing persistence works

## QA Checklist

- [ ] `/intelligence` loads for owner/admin/manager
- [ ] Deterministic briefing shows without OpenAI key
- [ ] Dashboard intelligence panel appears after guidance gates
- [ ] Nav shows Intelligence for permitted roles
- [ ] Migration grants verified in Supabase SQL Editor
