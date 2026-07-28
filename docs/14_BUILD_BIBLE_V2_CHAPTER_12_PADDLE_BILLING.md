# Auroranexis Build Bible V2 — Chapter 12: Enterprise FastSpring Billing

**Status:** Implemented  
**Version:** 2.0 Chapter 12  
**Priority:** After Chapter 11 Analytics

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch12-paddle-billing.mdc` (filename retained for continuity; content covers FastSpring as the sole active provider).

## Sources of truth

| Concern | Location |
|---------|----------|
| Active provider | `src/lib/billing/provider.ts` (always FastSpring) |
| Checkout | `src/lib/fastspring/checkout.ts`, `browser-checkout.ts` |
| Webhooks | `src/app/api/fastspring/webhook/route.ts`, `src/lib/fastspring/webhooks.ts` |
| Idempotency | `src/lib/fastspring/idempotency.ts` |
| Sync | `src/lib/fastspring/sync.ts` |
| Customer portal | `src/lib/billing/customer-portal.ts` (no hosted portal — fails closed) |
| Entitlements | `src/lib/entitlements/resolver.ts` |
| Commercial events | `src/lib/billing/commercial-events.ts` |
| Ops doc | `docs/paddle-billing.md` (filename retained; content is FastSpring) |

## Non-negotiables

- Do not change commercial outcomes, auth, RBAC, RLS, or API contracts
- Never grant entitlements from browser checkout success alone
- Never expose FastSpring secrets to the client
- Webhooks must remain signature-verified and idempotent
- Stripe and legacy Paddle remnants are archive/diagnostics only

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:fastspring-billing`, `npm run test:build-bible-ch12`.

Do not commit, push, or deploy in Chapter 12 — Release chapters own shipping.
