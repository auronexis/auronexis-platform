# Enterprise Integrations Framework

The integration platform connects Auroranexis workflow actions to external systems. Sprint 2 established the registry and simulation layer; Sprint 3 added the encrypted secrets vault; Sprint 4 enables **live execution** for configured messaging and webhook providers.

## Architecture

```
Automation Engine (engine-v2)
        ↓
Integration Dispatcher (execution/dispatcher.ts)
        ↓
Secret Resolver (secrets/repository.ts)
        ↓
Provider Adapter (LiveHttpIntegrationProvider / BaseIntegrationProvider)
        ↓
HTTP Client (execution/http-client.ts)
        ↓
External API
```

Workflow integration actions delegate to `dispatchWorkflowIntegrationAction()` for live runs. Simulation previews use `simulateWorkflowIntegrationAction()` in `src/lib/integrations/simulation.ts`.

See [runtime.md](./runtime.md) for delivery statuses, retries, rate limits, and monitoring.

## Module layout

| Path | Purpose |
|------|---------|
| `types.ts` | Provider contracts, health, simulation, execution, delivery logs |
| `registry.ts` | O(1) provider lookup with cached listing |
| `base.ts` | Shared provider adapter (placeholder providers) |
| `providers/live-http.ts` | Live HTTP provider adapter |
| `execution/` | Dispatcher, executor, HTTP client, retry, rate limit, logging |
| `validation.ts` | Config validation helpers |
| `webhook.ts` | Webhook request builder (GET/POST/PUT/PATCH/DELETE) |
| `http.ts` | Request preview builder with auth placeholders |
| `templates.ts` | `{{variable}}` substitution for URLs, headers, bodies |
| `secrets/` | Encrypted vault, masking, repository, server actions |
| `health.ts` | Provider health model for diagnostics |
| `simulation.ts` | Simulation engine and workflow preview bridge |
| `providers/` | Provider bootstrap (live + placeholder) |
| `queries.ts` | Dashboard, runtime, and log summaries |

## Registry

```typescript
registerIntegrationProvider(provider);
getIntegrationProvider("slack");
listIntegrationProviders();
```

The registry is populated at module load and frozen for stable O(1) lookups.

## Supported providers

**Live execution (Sprint 4):**

- Slack
- Microsoft Teams
- Discord
- Webhook

**Placeholder (simulate only):**

- REST API, Email, Jira, GitHub, Notion, Linear, Azure DevOps, Google Chat

Each provider implements:

```typescript
interface IntegrationProvider {
  id: string;
  name: string;
  liveExecutionSupported: boolean;
  validate(config): IntegrationValidationResult;
  simulate(input): IntegrationSimulationResult;
  execute(input): Promise<IntegrationExecutionResult>;
  health(config?): IntegrationHealthSnapshot;
}
```

## Workflow action types

| Action type | Provider | Live |
|-------------|----------|------|
| `send_slack_message` | slack | Yes |
| `send_teams_message` | microsoft_teams | Yes |
| `post_webhook` | webhook | Yes |
| `send_discord_notification` | discord | Yes |
| `rest_api_call` | rest_api | No |
| `send_email` | email | No |
| `create_jira_issue` | jira | No |
| `create_github_issue` | github | No |
| `create_notion_page` | notion | No |
| `create_linear_ticket` | linear | No |
| `create_azure_devops_work_item` | azure_devops | No |
| `send_google_chat_message` | google_chat | No |

Legacy placeholder types (`slack_placeholder`, etc.) remain skipped for backward compatibility.

## Secrets vault

Workflow configuration references credentials by **`secretId` only**:

```typescript
type IntegrationSecretReference = {
  secretId: string;
  label?: string;
};
```

- Encrypted at rest in `integration_secrets` (see [secrets.md](./secrets.md))
- Owner/Admin manage credentials at `/automation/integrations/secrets`
- Server-only decrypt at execution time via `getDecryptedSecretValue()`
- UI and simulation show masked previews only

## Simulation

`simulateIntegration()` and `simulateWorkflowIntegrationAction()` remain available for all providers. No outbound network calls are made during simulation.

## Security

- No decrypted secrets in API responses or client bundles
- No Authorization headers or tokens in delivery logs
- Server-only execution paths (`import "server-only"`)
- Request previews and audit payloads redact sensitive field names

## Diagnostics & UI

- **Settings → Diagnostics → Integrations** — registered providers and health
- **Settings → Diagnostics → Integration Runtime** — live delivery metrics
- **Settings → Diagnostics → Integration secrets** — vault readiness
- **Dashboard → Enterprise Integrations** — provider summary
- **Dashboard → Integration Runtime** — running, failed, retrying, delivered today
- **`/automation/integrations`** — provider catalog and simulation preview
- **`/automation/integrations/secrets`** — Owner/Admin credential vault
- **`/automation/integrations/logs`** — Owner/Admin runtime delivery logs

## Related

- [runtime.md](./runtime.md) — execution engine, retries, rate limits
- [secrets.md](./secrets.md) — vault encryption and rotation
- [security.md](./security.md) — platform security posture
