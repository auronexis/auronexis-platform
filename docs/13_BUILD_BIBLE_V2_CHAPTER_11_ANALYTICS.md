# Auroranexis Build Bible V2 — Chapter 11: Enterprise Analytics & Product Telemetry

**Status:** Implemented  
**Version:** 2.0 Chapter 11  
**Priority:** After Chapter 10 Accessibility

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch11-analytics.mdc`.

## Sources of truth

| Concern | Location |
|---------|----------|
| Event bus + sanitize | `src/lib/analytics/events.ts` |
| Taxonomy / aliases | `src/lib/analytics/taxonomy.ts` |
| Consent gate | `src/lib/analytics/consent-gate.ts` |
| Provider catalog | `src/lib/analytics/providers.ts`, `config.ts` |
| Funnel stages | `src/lib/analytics/funnel.ts` |
| Business event catalog | `src/lib/analytics/business-events.ts` |
| AI telemetry helper | `src/lib/analytics/ai-telemetry.ts` |
| Billing lifecycle hook | `src/lib/analytics/billing-lifecycle.ts` |
| Server GA4 MP | `src/lib/analytics/server-events.ts` |
| Client orchestration | `src/components/analytics/analytics-provider.tsx` |

## Non-negotiables

- Analytics never changes application behaviour
- Never send secrets, passwords, API keys, prompts, or customer confidential data
- Never send `organization_id` / `workspace_id` / `user_id` to third-party sinks
- Consent: analytics providers ≠ marketing (GA4)
- Do not modify auth, RBAC, RLS, Paddle billing, API contracts, or DB behaviour
- Providers must remain modular and env-gated

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:analytics-conversion`, `npm run test:build-bible-ch11`.

Do not commit, push, or deploy in Chapter 11 — Release chapters own shipping.
