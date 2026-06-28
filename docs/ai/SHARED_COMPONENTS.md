# Shared Components

Location: `src/components/ai/`

| Component | Purpose |
|-----------|---------|
| `AIUsageCard` | Calls, tokens, provider, latency, quota |
| `AIUpgradeCard` | Plan upgrade CTA (configurable title) |
| `AIDiffPreview` | Accept / reject proposed AI output |
| `AIHistory` | Session history with copy/reapply/delete/retry |
| `AIGenerationProgress` | Preparing → Generating → Validating → Complete |
| `AIErrorAlert` | Error + retry + clear |
| `AIEmptyState` | Standard empty states |

Feature modules re-export or wrap these for backward compatibility (e.g. `ReportAIUsageCard` → `AIUsageCard`).
