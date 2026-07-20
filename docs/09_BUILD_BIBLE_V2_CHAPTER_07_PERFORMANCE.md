# Auroranexis Build Bible V2 — Chapter 7: Performance, Caching & Scalability

**Status:** Implemented  
**Version:** 2.0 Chapter 7  
**Priority:** After Chapter 6 API standards

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch7-performance.mdc`.

## Sources of truth

| Concern | Location |
|---------|----------|
| Request memoization | React `cache()` on hot loaders (`plans`, `dashboard`, entity getters) |
| Shared concurrency | `src/lib/performance/map-with-concurrency.ts` |
| Dashboard orchestration | `src/app/(dashboard)/dashboard/page.tsx`, `src/lib/dashboard/**` |
| Portfolio batching | `src/lib/ai/client-success/portfolio.ts`, `src/lib/customer-success/snapshot.ts` |
| Code splitting | `src/components/performance/lazy-workspaces.tsx` |
| Job overlap guard | `hasRunningJobExecution` in `src/lib/jobs/scheduler.ts` |
| Historical backlog | `docs/performance-audit.md` (superseded for day-to-day standards) |

## Non-negotiables

- Do not change auth, RBAC, RLS, Paddle billing, API contracts, or visual behaviour.
- Prefer request-scoped `cache()` over inventing stale cross-request caches for tenant business data.
- Parallelize independent awaits; do not invent empty results.
- Cap portfolio loops with existing page sizes; preserve ranking semantics for the capped set.
- Lazy-load heavy client workspaces without changing UX (loading placeholders OK).
- Skip overlapping cron job executions unless forced.

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch7`.

Do not commit, push, or deploy in Chapter 7 — Release chapters own shipping.
