# Auroranexis Build Bible V2 — Chapter 12: Enterprise Paddle Billing

**Status:** Implemented  
**Version:** 2.0 Chapter 12  
**Priority:** After Chapter 11 Analytics

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch12-paddle-billing.mdc`.

## Sources of truth

| Concern | Location |
|---------|----------|
| Active provider | `src/lib/billing/provider.ts` (always Paddle) |
| Checkout | `src/lib/paddle/checkout.ts`, `browser-checkout.ts` |
| Webhooks | `src/app/api/paddle/webhook/route.ts`, `src/lib/paddle/webhooks.ts` |
| Idempotency | `src/lib/paddle/idempotency.ts` |
| Sync | `src/lib/paddle/sync.ts` |
| Portal | `src/lib/paddle/portal.ts` |
| Entitlements | `src/lib/entitlements/resolver.ts` |
| Commercial events | `src/lib/billing/commercial-events.ts` |
| Ops doc | `docs/paddle-billing.md` |

## Non-negotiables

- Do not change commercial outcomes, auth, RBAC, RLS, or API contracts
- Never grant entitlements from browser checkout success alone
- Never expose Paddle secrets to the client
- Webhooks must remain signature-verified and idempotent
- Stripe remnants are archive/diagnostics only

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:paddle-billing`, `npm run test:build-bible-ch12`.

Do not commit, push, or deploy in Chapter 12 — Release chapters own shipping.
