# Ask Auroranexis — AI Copilot Setup

Production guide for the Phase 20 enterprise AI copilot (`/copilot`).

## Overview

Ask Auroranexis is a tenant-safe, plan-gated, credit-aware operational intelligence assistant. It:

- loads organization-scoped context server-side only
- enforces RBAC and plan entitlements (`ai_report_assistant`)
- enforces monthly AI credits via `ai_usage_events`
- returns structured, source-grounded answers (facts vs recommendations)
- never logs full prompts or responses

## Provider options

Configured through server environment variables only (never exposed to the browser).

| Variable | Purpose |
|----------|---------|
| `AI_PROVIDER` | `openai` (default when `OPENAI_API_KEY` set), `placeholder`, or `disabled` |
| `OPENAI_API_KEY` | Server-only API key for OpenAI |
| `OPENAI_MODEL` | Model id (default: `gpt-4o-mini`) |

Compatibility: if `AI_PROVIDER` is unset but `OPENAI_API_KEY` exists, OpenAI is selected automatically.

Missing configuration does **not** fail the application build. Authorized users see **AI is not configured** on `/copilot`.

## Plan and credit behavior

Credits align with entitlement `aiCreditsPerMonth`:

| Plan | Monthly AI credits |
|------|-------------------|
| Starter | 0 |
| Professional | 500 |
| Business | 3,000 |
| Enterprise | Unlimited |

Enforcement is server-side in `assertWithinAIUsageLimit()` before provider invocation. Rejected requests (plan, permission, validation) are not charged.

Usage is recorded in `ai_usage_events` with `feature = ai_global_copilot`. Metadata only — no prompt/response bodies.

## Privacy considerations

- Workspace evidence (clients, risks, incidents, reports, SLA, health) may be sent to the configured AI provider to generate responses.
- Legal pages describe optional AI sub-processors conditionally (see Privacy Policy and Sub-processors).
- Users must review AI-generated outputs before operational decisions.

## Cost controls

- Max user prompt: 2,000 characters
- Context payload capped (~28k chars evidence)
- Bounded session history (4 turns)
- Provider timeout: 45s (OpenAI provider)
- Max one structured-output retry on invalid JSON
- Top-N aggregates instead of full database dumps

## Test checklist

```bash
npm run lint
npm run typecheck
npm run build
npm run test:ai-copilot
```

Manual QA:

- [ ] `/copilot` loads for Professional+ workspace
- [ ] Starter plan sees upgrade state (no error boundary)
- [ ] Credits decrease after successful generation
- [ ] Cross-tenant entity IDs return safe denial
- [ ] Client copilot on `/clients/[id]` scopes to that client only
- [ ] Executive brief link on dashboard opens `/copilot?task=executive_brief`
- [ ] No AI secrets in browser network tab

## Rollback procedure

1. Set `AI_PROVIDER=disabled` or remove `OPENAI_API_KEY`
2. Redeploy — deterministic dashboard intelligence remains unchanged
3. `/copilot` shows configuration/unavailable state; no data migration required

## Provider outage behavior

- Provider errors map to safe user messages (no raw stack traces)
- Deterministic executive brief and dashboard metrics continue to work
- Users can retry when `retryable: true`

## Owner configuration still required

Workspace owners/admins must:

1. Add `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in Vercel project settings
2. Confirm plan includes AI entitlements
3. Monitor usage under Settings → usage / billing views
