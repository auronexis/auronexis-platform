# Enterprise Connectors Platform

Phase 4 Sprint 6.5 introduces native OAuth connectors for enterprise ecosystems. Connectors integrate with the existing Integration Registry, Secrets Vault, Workflow Engine, Automation Engine, Diagnostics, Execution Engine, and Retry Engine without modifying RBAC, AI modules, billing, or the Public API.

## Architecture

```
Connector Registry (bootstrapConnectors)
        ↓
OAuth Platform (state → authorize → callback → Secrets Vault)
        ↓
Connector Module (auth / client / mapper / health / sync / webhook)
        ↓
Sync Engine (integration_sync_jobs + integration_connections)
        ↓
Workflow & Automation (existing integration actions)
```

Each connector lives under `src/lib/connectors/<provider>/` with:

| File | Purpose |
|------|---------|
| `types.ts` | Provider-specific resource types |
| `auth.ts` | OAuth helpers and env readiness |
| `client.ts` | API client factory |
| `mapper.ts` | External → internal record mapping |
| `health.ts` | Connection health evaluation |
| `sync.ts` | Sync entry point |
| `webhook.ts` | Webhook verification helpers |
| `index.ts` | Public module exports |

Shared infrastructure:

- `registry.ts` — connector registration and lookup
- `definitions.ts` — provider metadata (actions, triggers, OAuth URLs)
- `oauth/` — unified OAuth state, token exchange, vault storage
- `sync/` — job tracking, incremental/full/scheduled sync
- `shared/client-factory.ts` — authenticated HTTP client with vault-backed tokens

## OAuth lifecycle

1. **Authorize** — Owner/admin starts OAuth at `/api/connectors/oauth/{id}/authorize`. A short-lived state row is created in `integration_oauth_states` (optional PKCE for Google).
2. **Callback** — Provider redirects to `/api/connectors/oauth/{id}/callback`. State is consumed once; authorization code is exchanged for tokens.
3. **Storage** — Access and refresh tokens are encrypted in `integration_secrets` (`oauth_access_token`, `oauth_refresh_token`). Connection metadata is stored in `integration_connections`.
4. **Refresh** — `refreshAccessToken()` in the OAuth platform rotates tokens via provider token endpoints. Updated secrets replace prior vault entries.
5. **Revocation** — Disconnect marks secrets inactive and sets connection status to `revoked`.

OAuth app credentials use env keys `{PREFIX}_CLIENT_ID` and `{PREFIX}_CLIENT_SECRET` (e.g. `GOOGLE_CLIENT_ID`).

## Connector registry

Every connector registers:

- Provider id and version
- Supported workflow actions and triggers
- OAuth capability (`none`, `oauth2`, `oauth2_pkce`)
- Webhook and health capability flags

Use `listConnectorDefinitions()` after `bootstrapConnectors()` to enumerate registered providers.

## Sync engine

The sync engine (`runConnectorSync`) supports:

| Mode | Behavior |
|------|----------|
| `manual` | User-triggered from the connectors dashboard |
| `scheduled` | Reserved for cron/scheduler integration |
| `incremental` | Uses last cursor from `integration_sync_jobs` |
| `full` | Full refresh pass |

Jobs are tracked in `integration_sync_jobs` with duration, records changed, errors, and cursors. Connection rows store `last_sync_at` and `last_sync_status`.

## Mapping strategy

Each connector’s `mapper.ts` normalizes external records into a consistent shape for workflows and diagnostics. Destructive operations are not enabled by default; connectors focus on read metadata, listing, and safe write actions (create issue, add comment, etc.).

## Security

- OAuth tokens, refresh tokens, and API keys are **never** exposed in UI, logs, or API responses.
- All secrets are encrypted at rest via the Integration Secrets Vault.
- Token rotation is supported through vault secret replacement.
- OAuth state tokens expire after 10 minutes and are single-use.
- Connect/manage operations require Professional+ (`ai_automation_builder`) and owner/admin role.

## Extension guide

1. Add a `ConnectorModuleConfig` entry in `definitions.ts`.
2. Run or extend `scripts/generate-connector-modules.mjs` for the provider folder.
3. Register the connector in `bootstrap.ts` (via `ALL_CONNECTOR_CONFIGS`).
4. Configure `{PREFIX}_CLIENT_ID` and `{PREFIX}_CLIENT_SECRET` in the deployment environment.
5. Set `NEXT_PUBLIC_APP_URL` so OAuth redirect URIs match your deployment.

Optional: implement provider-specific client methods beyond the shared factory for richer API coverage.

## Dashboard

Route: `/automation/connectors`

Displays connected services, health, last sync, token expiry, available actions/triggers, and connect/disconnect/sync controls.

## Diagnostics

Settings → Diagnostics includes an **Enterprise Connectors** section with connected providers, OAuth readiness, token validity, refresh failures, sync timestamps, and per-provider health.

## Supported connectors (v1)

Google Workspace, Microsoft 365, Jira, GitHub, GitLab, Notion, Slack, Teams, Linear, HubSpot, Salesforce, Zendesk, ClickUp.
