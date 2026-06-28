# Integration Runtime Engine

Phase 4 Sprint 4 introduces live integration execution for configured providers. Simulation remains available for all providers and for manual preview flows.

## Execution flow

```
Workflow Engine (engine-v2)
        ↓
Integration Dispatcher (execution/dispatcher.ts)
        ↓
Secret Resolver (secrets/repository.ts — getDecryptedSecretValue)
        ↓
Provider Adapter (LiveHttpIntegrationProvider / BaseIntegrationProvider)
        ↓
HTTP Client (execution/http-client.ts)
        ↓
External API
```

Workflow actions reference credentials with `secretId` only. Decrypted values exist in server memory for the duration of a single request and are never persisted or returned to the client.

## Module layout

| Path | Purpose |
|------|---------|
| `execution/dispatcher.ts` | Workflow action entry point |
| `execution/executor.ts` | Live execution orchestration |
| `execution/http-client.ts` | Fetch wrapper with timeout, retries, auth |
| `execution/retry.ts` | Delivery retry schedule and policies |
| `execution/rate-limit.ts` | Per-org, per-provider rolling limits |
| `execution/logging.ts` | `integration_delivery_logs` persistence |
| `execution/responses.ts` | Provider response parsing |
| `execution/audit.ts` | Sanitized audit summaries |
| `execution/queue.ts` | Pending delivery queue size |
| `execution/health.ts` | Runtime diagnostics and dashboard metrics |

## Delivery statuses

| Status | Meaning |
|--------|---------|
| `queued` | Log created, awaiting send |
| `sending` | Outbound request in progress |
| `delivered` | Provider accepted the request |
| `failed` | Non-retryable or first-attempt failure |
| `rate_limited` | Org/provider limit exceeded |
| `retrying` | Scheduled for retry |
| `dead_letter` | Max retries exhausted |

Stored fields include response code, latency, retry count, delivery id, and provider message id.

## Retry strategy

Default schedule per live provider (Slack, Teams, Discord, Webhook):

```
Immediate → 5 sec → 30 sec → 5 min → dead letter
```

Persisted on each log row:

- `retry_count`
- `last_retry_at`
- `next_retry_at`
- `failure_reason`

HTTP-level retries (exponential backoff) are separate and handled inside `http-client.ts` for transient network errors.

## Rate limits

Rolling 60-second windows per organization and provider:

| Provider | Limit |
|----------|-------|
| Slack | 30/min |
| Microsoft Teams | 30/min |
| Discord | 30/min |
| Webhook | 60/min |

When exceeded, delivery status is `rate_limited` — the engine does not crash.

## Live vs placeholder providers

**Live execution enabled:**

- Slack
- Microsoft Teams
- Discord
- Generic Webhook

**Placeholder (simulate only):**

- Jira, GitHub, Notion, Linear, Azure DevOps, Google Chat, REST API, Email

Only providers that are fully configured (valid config + active `secretId` in vault) may execute live.

## Monitoring

| Surface | Path | Access |
|---------|------|--------|
| Runtime logs | `/automation/integrations/logs` | Owner/Admin |
| Diagnostics | Settings → Diagnostics → Integration Runtime | Owner/Admin |
| Dashboard widget | Integration Runtime | Plan-gated automation |

Logs show provider, workflow, status, retries, duration, timestamp, and response code. Authorization headers and secret values are never logged.

## Simulation

Simulation remains available via:

- Integrations workspace preview
- `simulateIntegration()` / `simulateWorkflowIntegrationAction()`
- Provider `simulate()` method on all providers

Manual workflow simulation (`options.simulated`) completes without running actions; use the integrations UI for action-level previews.

## Database

Migration: `supabase/migrations/20250623360000_integration_delivery_logs.sql`

Apply to remote Supabase and reload PostgREST schema after migration.

## Environment

Live execution requires:

- `INTEGRATION_SECRET_KEY` — 64-character hex key for vault decryption
- Applied `integration_delivery_logs` migration
