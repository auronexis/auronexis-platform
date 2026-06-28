# Caching

- **React `cache()`** — used on read-heavy AI getters (`getKnowledgeHubData`, `getOperationalIntelligence`, `getAIDiagnosticsSnapshot`)
- **Context build timing** — `timeAIContextBuild()` measures duration without duplicate fetches when callers reuse cached hub data
- **Provider instance** — `resolveAIProvider()` returns singleton-configured provider per request

Avoid rebuilding identical context within the same server action by fetching once and passing through prompt builders.
