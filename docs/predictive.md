# Predictive Intelligence

Phase 4 Sprint 5 introduces deterministic predictive intelligence on top of verified workspace data. Predictions are **rules-based** — no LLM generation, no hallucination.

## Architecture

```
Verified Database Signals
        ↓
Predictive Queries (queries.ts)
        ↓
Scoring + Forecasting (scoring.ts, forecasting.ts)
        ↓
Anomaly Detection (anomaly.ts)
        ↓
Recommendation Engine (recommendations.ts)
        ↓
Prediction Engine (engine.ts)
        ↓
React Cache (cache.ts)
        ↓
Dashboard / Client UI
```

## Module layout

| File | Purpose |
|------|---------|
| `types.ts` | Forecast cards, recommendations, confidence, diagnostics |
| `queries.ts` | Organization and client snapshots from DB |
| `scoring.ts` | Churn, SLA, incident, risk, report, health, profitability scores |
| `forecasting.ts` | Historical comparison and linear projection |
| `recommendations.ts` | Actionable recommendations with deep links |
| `anomaly.ts` | Portfolio anomaly detection |
| `engine.ts` | Workspace and client analysis assembly |
| `cache.ts` | React `cache()` + org-level result cache and hit ratio |
| `actions.ts` | Refresh server actions |
| `index.ts` | Public exports |

## Predictions

The engine predicts (from verified data only):

- Customer churn probability
- SLA breach probability
- Incident probability and severity
- Risk escalation probability
- Report overdue probability
- Customer health trend
- Profitability trend
- Automation success trend

## Historical analysis

Windows analyzed:

- Last 7 days
- Last 30 days
- Last 90 days
- Last 12 months

Flow:

```
Current → Historical → Trend → Forecast
```

Implemented via `compareWindows()` and `forecastMetric()` in `forecasting.ts`.

## Confidence engine

Shared confidence scoring considers:

- Data quality
- History length
- Report coverage
- Communication coverage
- Incident history
- SLA history

Labels: **Very High**, **High**, **Medium**, **Low**

## Recommendation engine

Every recommendation includes:

- Title
- Explanation
- Reason (verified signal)
- Confidence score and label
- Deep link (`href`)

Examples: contact customer, publish report, review SLA, investigate incident trend, review profitability.

## Cache

- `getPredictiveIntelligence()` — React `cache()` per request + org-level Map for cross-request reuse
- `refreshPredictiveIntelligence()` — bypasses cache and recomputes
- Diagnostics expose cache hit ratio, refresh duration, and prediction latency

## Plan gating

Feature key: `ai_predictive_intelligence` (Professional+)

Starter plans see upgrade panels on:

- `/dashboard/predictive`
- Dashboard Predictive Forecast widget
- Client detail Predictive Intelligence section

## UI surfaces

| Surface | Path |
|---------|------|
| Workspace forecast | `/dashboard/predictive` |
| Dashboard widget | Dashboard → Predictive Forecast |
| Client forecast | `/clients/[id]` → Predictive Intelligence |
| Diagnostics | Settings → Predictive Intelligence |

## Security

- Server-only execution (`import "server-only"` on queries/cache)
- No internal IDs in user-facing prediction text (names only)
- No secrets, prompts, or AI provider payloads exposed
- Revenue hidden for roles without financial visibility

## Extension points

1. Add new signals in `queries.ts` snapshot builders
2. Add scoring functions in `scoring.ts`
3. Register recommendations in `recommendations.ts`
4. Extend forecast cards in `engine.ts`
5. Wire new UI sections in `predictive-workspace.tsx`

## Related

- [integrations.md](./integrations.md)
- [runtime.md](./runtime.md)
- [ai.md](./ai.md)
