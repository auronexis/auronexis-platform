# Auroranexis Build Bible V2 — Chapter 5: Database & Supabase Standards

**Status:** Implemented  
**Version:** 2.0 Chapter 5  
**Priority:** After Chapter 4 design system

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch5-database.mdc`.

## Sources of truth

| Concern | Location |
|---------|----------|
| Schema migrations | `supabase/migrations/**` |
| Generated DB types | `src/types/database.ts` (`Tables` / `TablesInsert` / `TablesUpdate`) |
| Browser / server / admin clients | `src/lib/supabase/**` |
| Typed insert/update helpers | `src/lib/supabase/typed.ts` |
| Tenant scope helpers | `src/lib/tenancy/organization-scope.ts` |
| Domain queries & mutations | `src/lib/**` (services only) |

## Non-negotiables

- No SQL or Supabase clients in presentation components.
- Tenant isolation via organization boundaries must remain intact — do not weaken RLS.
- Prefer typed insert/update helpers over scattered `as never` casts.
- Consolidate duplicate select strings and query helpers.
- Migrations must be ordered, deterministic, and non-destructive without explicit justification.
- Never expose service-role credentials to the client.
- Preserve auth, RBAC, RLS behaviour, Paddle billing, and API/DB contracts.

## Chapter 5 outcomes

- Canonical selects/mappers for health snapshots, subscriptions, SLA policies/events, escalation rules.
- Additive `organization_id` index coverage migration.
- Typed `insertRows` / `updateRows` / `upsertRows` helpers; prefs DB migrated off call-site `as never`.
- Reset-password Supabase access moved into `src/lib/auth/reset-session.ts`.

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch5`.

Do not commit, push, or deploy in Chapter 5 — Release chapters own shipping.
