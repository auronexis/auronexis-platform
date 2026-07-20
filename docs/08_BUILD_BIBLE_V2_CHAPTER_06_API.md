# Auroranexis Build Bible V2 — Chapter 6: API, Server Actions & Integration Standards

**Status:** Implemented  
**Version:** 2.0 Chapter 6  
**Priority:** After Chapter 5 database standards

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch6-api.mdc`.

## Sources of truth

| Concern | Location |
|---------|----------|
| Public API middleware | `src/lib/api/middleware/handler.ts` |
| API responses | `src/lib/api/responses/json.ts` |
| List/pagination helpers | `src/lib/api/list.ts`, `src/lib/api/validation/query.ts` |
| Server action errors | `src/lib/action-errors.ts` |
| Form validation helpers | `src/lib/validation/form-fields.ts` |
| Webhook signing | `src/lib/webhooks/signing.ts` |
| Paddle webhooks | `src/lib/paddle/**`, `src/app/api/paddle/webhook` |
| Jobs / cron | `src/lib/jobs/**`, `src/app/api/cron/run` |

## Non-negotiables

- API routes are orchestration only — business logic lives in `src/lib/**`.
- Preserve auth, RBAC, RLS, Paddle billing, API contracts, and UI behaviour.
- Centralize duplicated list/query/error/validation helpers.
- Webhooks must keep signature verification and idempotency.
- Never expose secrets or raw internal errors to clients.
- No commit, push, or deploy in Chapter 6 — Release chapters own shipping.

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch6`, plus paddle and related backend tests.
