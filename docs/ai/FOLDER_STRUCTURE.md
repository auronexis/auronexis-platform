# Folder Structure

```
src/lib/ai/
  core/           # Shared AI Core (Sprint 9)
  copilot/        # Report quality, suggestions, sections
  operational/    # Risk/incident copilot
  knowledge/      # Knowledge hub
  automation-builder/
  client-success/
  insights/
  usage/          # Quotas + recording
  providers/      # OpenAI, placeholder
  server/         # Config, resolve-provider
  errors.ts       # AIUserError + message constants
  types.ts        # Report AI types
  context-builder.ts
  report-assistant-action.ts

src/components/ai/     # Shared UI
src/components/reports/ai/
src/components/operational/ai/
src/components/knowledge/
docs/ai/               # Developer documentation
```

## Future extension points

- Vector search: `lib/ai/knowledge/vector-interface.ts`
- Streaming: extend `AIGenerationProgress` + provider interface
- Additional providers: register in `providers/index.ts`
