# Auroranexis Build Bible V2 — Chapter 3: Next.js & TypeScript Standards

**Status:** Implemented (Next.js & TypeScript standards audit + remediation complete; not released)  
**Version:** 2.0 Chapter 3  
**Priority:** After Chapter 2 architecture

Validation gates: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch3`.

Do not commit, push, or deploy in Chapter 3 — Release chapters own shipping.

## Next.js

- Prefer Server Components; Client Components only when hooks, events, browser APIs, or client context require it.
- Pages/layouts compose; data fetching on the server unless interactive.
- Thin `route.ts` handlers; shared services in `src/lib/**`.
- Consistent `loading.tsx` / `error.tsx` / `not-found.tsx` patterns.
- Correct rendering strategy per route (static / dynamic / streaming).

## TypeScript

- Strict mode remains on.
- No `any`, `@ts-ignore`, `@ts-nocheck` unless unavoidable and documented at the call site.
- Prefer typed interfaces over unjustified assertions (`as never`, `as any`).
- Exported service functions expose explicit parameter and return types.
- API contracts stay strongly typed.

## Imports & boundaries

- Prefer `@/` aliases over deep relative imports.
- Never import `server-only` or server Supabase clients into Client Components.
- No secrets in client bundles.

## Quality

- Remove dead code, unused imports/exports, duplicate helpers.
- Preserve UI behaviour, RBAC, RLS, Paddle billing, auth.

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch3`.

Do not commit, push, or deploy in Chapter 3 — Release chapters own shipping.
