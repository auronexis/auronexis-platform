# AI Architecture

Auroranexis AI is organized as a **shared core** plus **feature modules**. All customer-facing AI runs server-side through server actions. No API keys or raw prompts are exposed to the browser.

## Layers

```
UI (components/ai + feature panels)
  ↓ server actions
Feature modules (report, operational, knowledge, automation, insights, client-success)
  ↓
AI Core (lib/ai/core)
  ↓
Providers (OpenAI / placeholder) + Supabase (usage, activity)
```

## Feature modules

| Module | Path | Plan feature |
|--------|------|--------------|
| Report Copilot | `lib/ai/report-assistant-action.ts` | `ai_report_assistant` |
| Risk / Incident Copilot | `lib/ai/operational/` | `ai_risk_assistant`, `ai_incident_assistant` |
| Operational Intelligence | `lib/ai/insights/` | `ai_report_assistant` |
| Client Success | `lib/ai/client-success/` | `ai_client_success`, `ai_client_analysis` |
| Automation Builder | `lib/ai/automation-builder/` | `ai_automation_builder` |
| Knowledge Hub | `lib/ai/knowledge/` | `ai_knowledge_search`, etc. |

## Shared core

See `src/lib/ai/core/` for errors, validation, retry, history, observability, prompts, and output helpers.

## Security

- Organization-scoped DB queries only
- Verified context from database — never client-only trust
- User-safe error messages via `toAIActionError()`
- Usage recorded in `ai_usage_events` via service role
