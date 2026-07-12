# Phase 29 — Production OpenAI Integration

## Overview

Phase 29 delivers the first production OpenAI capability in Auroranexis: **AI-assisted executive report summaries** with truthful platform status, persisted health checks, Supabase-backed rate limits, and organization-scoped request logging.

## Architecture Reused

- Canonical session resolver (`requireSession`)
- Report tenancy (`organization_id` scoping, `getReportById`, client verification)
- RBAC (`canAccessModule`, `canEditReport`, `canManageOrganizationSettings`)
- Plan entitlements (`assertCanUseFeature` → `ai_report_assistant`)
- Existing report draft/edit workflow and `buildTrustedReportAIContext`
- Activity logging (`recordActivityEvent`)
- Analytics events (`trackAnalyticsEvent` with sanitized props)
- Enterprise Integration Center (`/settings/integrations`)
- Public status page (`/status`)

## Provider Configuration

Module: `src/lib/ai/openai/config.ts`

| Variable | Purpose |
|----------|---------|
| `AI_ENABLED` | Strict boolean (`true`/`false`); defaults to enabled when unset |
| `AI_PROVIDER` | Must be `openai` |
| `OPENAI_API_KEY` | Server-only secret |
| `OPENAI_MODEL` | Configurable model (default: `gpt-4o-mini`) |
| `OPENAI_TIMEOUT_MS` | Optional timeout (default 30s) |
| `OPENAI_MAX_OUTPUT_TOKENS` | Optional output cap (default 1200) |

States: `disabled`, `not_configured`, `configured`, `connected`, `degraded`

## OpenAI Client

Module: `src/lib/ai/openai/client.ts`

- Server-only lazy singleton
- Explicit timeout via SDK config
- Normalized error classification in `errors.ts`
- Responses API in `responses.ts` (not Chat Completions or Assistants)

## Connection Test

- Action: `testOpenAIConnectionAction` in `src/lib/integrations/center/actions.ts`
- Requires authenticated owner/admin (organization settings permission)
- Enforces `ai_report_assistant` plan entitlement
- Minimal Responses API probe with no customer data
- Results persisted in `platform_openai_health_checks`
- Usage recorded in `ai_request_logs` with feature `connection_test`

## Executive Summary Feature

- Action: `generateExecutiveSummaryAction` in `src/lib/ai/executive-summary/action.ts`
- UI: `ExecutiveSummaryGenerator` in report draft/edit form
- User must review and explicitly apply — no auto-save or publish
- Existing summary is never silently overwritten (preview-first workflow)

### Prompt Version

`executive-summary-v1`

### Structured Schema

- `headline`
- `executive_summary`
- `key_outcomes[]`
- `key_risks[]`
- `recommended_next_steps[]`
- `confidence_note`

Validated server-side with Zod (`schema.ts`) and OpenAI `json_schema` structured output.

## Data Sent (Whitelisted)

- Client display name
- Report title and period
- Health/SLA indicators (when available)
- Open risk and incident summaries (title + severity)
- Operational trends from permitted report fields
- Report metrics counts
- Existing draft executive summary context
- Permitted recent activity summaries
- Organization language (`de` / `en`)

## Data Excluded

- User emails, billing data, Stripe IDs, passwords, tokens, API keys
- Unrelated clients/organizations
- Raw database rows or unrestricted activity history
- Full prompts/responses in logs

## Tenancy & RBAC

Every AI action scopes by `organization_id`, verifies client/report ownership, and rejects cross-tenant IDs. Report generation requires draft status and `canEditReport`.

## Entitlements

`ai_report_assistant` plan feature required for generation and connection tests.

## Cost Controls

Supabase-backed limits in `src/lib/ai/openai/rate-limit.ts`:

- Per-user cooldown: 30s
- Per-organization hourly cap: 60 requests
- Per-report feature cooldown: 45s
- In-progress duplicate protection via `ai_request_logs`
- Max input size check (12k chars)
- Bounded output tokens and timeout

## Usage Logging

Migration: `supabase/migrations/20250708000000_openai_platform_phase29.sql`

Tables:

- `ai_request_logs` — organization-scoped request metadata (no prompt/response bodies)
- `platform_openai_health_checks` — platform-level connection test history (service role only)

## Public Status Derivation

`/status` AI component uses `getOpenAIPlatformStatus()`:

| State | Public detail |
|-------|---------------|
| `disabled` | Disabled |
| `not_configured` | Not configured |
| `connected` (recent success) | Operational |
| `degraded` (recent failure) | Degraded |
| `configured` (no recent check) | Unknown |

Environment variable presence alone does **not** show Operational.

## Integration Center

OpenAI card shows real state, model, last successful/failed check, latency, sanitized error, usage summary (`No usage recorded yet` when empty), and Test connection button for authorized users.

## Privacy & Security

Data flow: **Auroranexis server → OpenAI API → structured response → user-reviewed draft**

- User-triggered only
- No browser secret exposure
- No tool calling, file upload, or arbitrary prompts/models from client
- Generated text treated as untrusted; escaped in UI

## Tests

```bash
npm run test:openai-integration
```

Covers configuration, Responses API usage, status derivation, tenancy/RBAC patterns, structured output workflow, rate limits, and privacy constraints.

## Owner Checklist

1. `OPENAI_API_KEY` exists only server-side in Vercel
2. `AI_PROVIDER=openai`
3. `AI_ENABLED=true`
4. Configured model is permitted in the OpenAI project
5. OpenAI budget alerts are configured
6. Auroranexis application limits are conservative
7. Review one German and one English generated summary
8. Confirm no automatic publication occurs
9. Verify OpenAI Usage Dashboard after live connection test
10. Rotate key immediately if ever exposed

## Limitations

- Connection test and generation require migration applied in production Supabase
- Public status shows Unknown until a real connection test succeeds
- Legacy report assistant actions still use the existing provider path; structured executive summaries use the new Responses API module
- Anthropic not implemented in this phase
