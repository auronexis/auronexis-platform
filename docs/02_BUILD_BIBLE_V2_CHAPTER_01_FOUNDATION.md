# Auroranexis Build Bible V2 — Chapter 1: Foundation & Execution Rules

**Status:** Implemented  
**Version:** 2.0 Chapter 1  
**Priority:** 1 — supersedes conflicting implementation patterns

---

## Relationship to Build Bible V1

`docs/01_BUILD_BIBLE_V1.md` remains canonical for **product vision, positioning, and ICP**.

This Chapter 1 document is canonical for **engineering, architecture, security, billing runtime, and code-hygiene rules**.

If V1 and V2 ever conflict on an engineering topic, **V2 wins**. Product intent from V1 still guides *what* to build; V2 governs *how* it must be built.

---

## Purpose

This chapter is a mandatory engineering specification. It is not a suggestion and not a checklist. Every future implementation must satisfy these rules before a chapter (or feature) is considered complete.

---

## Priority order

1. Build Bible V2 specification
2. Existing architecture
3. Existing implementation

If existing code conflicts with this specification, modify the code to comply.

---

## General execution rules

- Do not skip requirements.
- Do not invent alternative implementations that diverge from the specified architecture.
- Do not leave unfinished work.
- Do not create temporary fixes.
- Do not introduce technical debt.
- Do not use `TODO` or `FIXME` comments.
- Do not create placeholder implementations.
- Do not regress existing functionality.

---

## Implementation requirements

Every modification must be:

- production ready
- maintainable
- reusable
- fully typed
- documented where appropriate
- consistent with the existing architecture

---

## Architecture rules

- Business logic belongs only in the service layer (`src/lib/**`).
- Presentation components must not contain business logic.
- Presentation components must not access the database directly.
- Presentation components must not import `@/lib/supabase/server` or `@/lib/supabase/admin`.
- API routes must not contain UI logic or return JSX.
- Prefer Server Components; use Client Components only when required (`"use client"`).
- Avoid unnecessary `useEffect` / `useState` and duplicate data fetching.
- Avoid duplicate services, hooks, utilities, and components — refactor into reusable modules.

---

## TypeScript

- TypeScript `strict` mode is mandatory (`tsconfig.json` → `"strict": true`).
- Do not use `any`, `@ts-ignore`, or `@ts-nocheck` unless technically unavoidable and justified in the PR description.
- Do not add `typescript.ignoreBuildErrors` or `eslint.ignoreDuringBuilds` to Next.js config.

---

## Database & Supabase

- Do not perform destructive migrations that delete production data.
- Protect relational integrity; keep migrations deterministic and safe.
- Row Level Security must remain enabled on tenant-scoped tables.
- Tenant isolation must never be weakened.
- Never expose secrets to the client.
- Every new tenant-scoped table migration must include `ENABLE ROW LEVEL SECURITY` and organization-scoped policies in the same migration.

### Two-layer access model

1. **Layer 1 — RLS:** PostgreSQL policies isolate rows by organization (via `current_organization_id()` / related helpers).
2. **Layer 2 — RBAC:** Server Actions and route guards enforce role permissions. RLS alone is not sufficient for privileged mutations.

---

## RBAC

- Preserve the existing role hierarchy.
- Do not accidentally increase or reduce permissions.
- Every new feature must respect RBAC guards.

---

## Billing

- **Paddle is the only active billing provider.**
- Do not reintroduce Stripe runtime (SDK, `/api/stripe`, checkout/portal branching on Stripe).
- Historical Stripe data remains archive-only.
- Platform catalog prices use the plan's billed currency (currently EUR); workspace CRM currency (`organizations.currency`) is a separate domain.

### Money formatting

- Workspace / CRM amounts: `formatWorkspaceMoney` (`src/lib/i18n/format.ts`).
- Billing / invoice cents: `formatMoneyFromCentsLocale` (canonical). Thin wrappers may delegate to it; do not invent parallel `Intl.NumberFormat` money helpers.

---

## Code quality

Continuously remove:

- dead code
- unused imports
- duplicate logic
- unused dependencies

---

## Performance

- Do not reduce performance.
- Avoid N+1 queries.
- Optimize database access.

---

## Validation gate (every chapter)

Before completing this chapter and every future chapter:

```bash
npm run lint
npm run typecheck
npm run build
```

No new errors. Do not weaken the gate.

Also run chapter-specific tests when present (for Chapter 1: `npm run test:build-bible-ch1`).

---

## Chapter 1 completion criteria

This chapter is complete only when:

1. This specification is committed and linked from Cursor rules.
2. ESLint enforces the TypeScript and Stripe import bans.
3. Dead Stripe-runtime shims are removed.
4. Money formatting converges on the canonical helpers (no hardcoded billing currency bugs).
5. No `TODO`/`FIXME` comments remain in `src/`.
6. `lint` / `typecheck` / `build` succeed.

A successful build alone is not completion.
