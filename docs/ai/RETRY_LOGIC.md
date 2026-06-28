# Retry Logic

## Server

- `toAIActionError()` sets `retryable: true` for provider, timeout, invalid response, and cancelled errors
- Plan, rate limit, access, and validation errors are not retryable

## Client

- Copilot providers store `lastActionRef` and expose `retryLastAction()`
- Workspaces use `AIErrorAlert` with `onRetry` when `retryable === true`
- Knowledge Hub tracks `lastFailedAction` (search vs ask) for context-preserving retry

Retry always reuses the same input/context — never silently changes prompts.
