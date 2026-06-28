# Context Flow

## Principles

1. **Verified data only** — risks, incidents, reports, profitability, activity from Supabase
2. **Organization isolation** — every query filters by `organization_id`
3. **No client-only trust** — form values merged but operational facts come from DB
4. **Knowledge injection** — when plan allows, `searchKnowledgeForReport` / `searchKnowledgeForOperational` adds snippets
5. **Caching** — `React cache()` on hub/intelligence getters; `timeAIContextBuild()` measures build time

## Context builders

| Builder | File |
|---------|------|
| Report | `lib/ai/context-builder.ts` |
| Operational | `lib/ai/operational/context-builder.ts` |
| Knowledge hub | `lib/ai/knowledge/get-hub.ts` |

## Version

Context schema version: `AI_CONTEXT_VERSION` in `lib/ai/core/versions.ts`
