# Provider Flow

1. `resolveAIProvider()` reads `AI_PROVIDER` / `OPENAI_API_KEY` from server env
2. Returns `{ provider, devNotice? }` — devNotice is diagnostics-only
3. Provider implements `generate({ prompt, action, context })`
4. OpenAI errors mapped to `AIUserError` in `providers/openai.ts`
5. Placeholder provider used when no API key configured

Never expose provider IDs, models, or errors raw to end users — only friendly messages.
