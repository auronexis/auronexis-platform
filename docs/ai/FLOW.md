# AI Flow

## Standard generation flow

1. **Plan + RBAC gate** — `assertCanUseFeature`, `canAccessModule`
2. **Usage gate** — `assertWithinAIUsageLimit`
3. **Context build** — `timeAIContextBuild()` + trusted DB fetchers
4. **Prompt assembly** — module prompt builder + shared anti-hallucination rules
5. **Provider generate** — `resolveAIProvider().generate()`
6. **Output validation** — `validateAIOutput()`
7. **Usage + metrics** — `recordAIUsageEvent`, `recordAIGenerationMetric`
8. **Activity log** — `recordActivityEvent` (where applicable)
9. **UI** — diff preview → accept/reject → optional 30s undo

## Retry flow

- Server returns `{ ok: false, error, code, retryable }` via `toAIActionError()`
- Client panels store last action input and call `retryLastAction()`
- Shared `AIErrorAlert` provides Retry / Clear output

## Cancellation

- Client sets loading false and aborts UI state (provider cancellation hook reserved for future streaming)
