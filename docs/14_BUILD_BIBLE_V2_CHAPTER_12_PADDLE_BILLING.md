# Auroranexis Build Bible V2 — Chapter 12: Enterprise Billing (Mollie)

**Status:** Implemented
**Version:** 2.0 Chapter 12
**Priority:** After Chapter 11 Analytics

> **CURRENT BILLING PROVIDER: MOLLIE**
> Filename / historical titles may still say Paddle or FastSpring. Runtime and ops use Mollie only. See [billing.md](./billing.md) and [paddle-billing.md](./paddle-billing.md) (HISTORICAL).

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch12-paddle-billing.mdc` (filename retained for continuity; **active provider is Mollie**).

## Sources of truth

| Concern | Location |
|---------|----------|
| Active provider | `src/lib/billing/provider.ts` (always Mollie) |
| Checkout | `src/lib/billing/providers/mollie/**` |
| Webhooks | `src/app/api/mollie/webhook/route.ts` |
| Entitlements | `src/lib/entitlements/resolver.ts` |
| Commercial events | `src/lib/billing/commercial-events.ts` |
| Ops doc | [billing.md](./billing.md) |
| Historical FastSpring/Paddle ops | [paddle-billing.md](./paddle-billing.md) — SUPERSEDED |

## Non-negotiables

- Do not change commercial outcomes, auth, RBAC, RLS, or API contracts casually
- Never grant entitlements from browser checkout success alone
- Never expose Mollie secrets to the client
- Webhooks must remain idempotent with API re-fetch
- Stripe, Paddle, and FastSpring remnants are archive/diagnostics only (FastSpring routes = 410)
- Keep `MOLLIE_LIVE_CHARGING_ENABLED=false` until explicit LIVE approval

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:mollie-billing`, `npm run test:build-bible-ch12`.

Do not commit, push, or deploy in Chapter 12 — Release chapters own shipping.
