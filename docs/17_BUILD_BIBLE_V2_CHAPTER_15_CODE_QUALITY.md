# Auroranexis Build Bible V2 — Chapter 15: Code Quality & Maintainability

**Status:** Implemented  
**Version:** 2.0 Chapter 15  
**Priority:** After Chapter 14 Production Readiness

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch15-code-quality.mdc`.

This chapter raises maintainability without changing product behaviour, auth, RBAC, RLS, Paddle, or API contracts.

## Sources of truth

| Concern | Location |
|---------|----------|
| Technical debt catalog | `docs/technical-debt.md` |
| Architecture overview | `docs/architecture.md` |
| Shared test helpers | `scripts/_test-helpers/read-source.mjs` |
| Typed Supabase helpers | `src/lib/supabase/typed.ts` |
| UI primitives | `src/components/ui/` (`StatusBadge`, `EmptyState`, `CompactEmptyState`) |
| Chapter compliance | `scripts/build-bible-ch15.test.mjs` |
| Quality contracts | `scripts/code-quality.test.mjs` |

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run test:build-bible-ch15` | Chapter 15 compliance |
| `npm run test:code-quality` | Maintainability / dead-export / typing contracts |
| `npm run test:enterprise-regression` | Includes ch15 + quality suite |

## Quality standards

- Prefer shared helpers over duplicated `readSource` / formatters / empty chrome
- Domain badges compose `StatusBadge`; compact empty panels compose `CompactEmptyState`
- No `TODO`/`FIXME` in `src/`
- No `as any` / `@ts-ignore` in `src/`
- No Stripe npm dependency; no reintroduction of `/api/stripe`
- Prefer Server Components; `"use client"` only when interactivity requires it
- Prefer `insertTyped` / `updateTyped` / `upsertTyped` for new Supabase writes (gradual migration)

## Non-negotiables

- Do not modify business logic, authentication, authorization, RBAC, RLS, Paddle behaviour, or API contracts
- Do not mass-replace `as never` without schema review (documented debt)
- Do not redesign UI chrome beyond shared-primitive composition
- Do not commit, push, or deploy from Chapter 15

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch15`, `npm run test:code-quality`, `npm run test:enterprise-regression`.
