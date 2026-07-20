# Auroranexis Build Bible V2 — Chapter 16: Technical Debt Elimination

**Status:** Implemented  
**Version:** 2.0 Chapter 16  
**Priority:** After Chapter 15 Code Quality

This chapter identifies, classifies, and safely eliminates remaining technical debt without changing product behaviour.

## Sources of truth

| Concern | Location |
|---------|----------|
| Debt inventory (discovery) | `docs/technical-debt-inventory-ch16.md` |
| Living debt catalog | `docs/technical-debt.md` |
| Chapter compliance | `scripts/build-bible-ch16.test.mjs` |
| Debt contracts | `scripts/technical-debt.test.mjs` |
| Prior quality contracts | `scripts/code-quality.test.mjs` |

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run test:build-bible-ch16` | Chapter 16 compliance |
| `npm run test:technical-debt` | Debt removal contracts |
| `npm run verify:domain-routing` | Manual domain routing checks |
| `npm run test:enterprise-regression` | Includes ch16 + debt suite |

## Non-negotiables

- No business logic, auth, RBAC, RLS, Paddle, or API contract changes
- No UI redesigns or speculative architecture
- High-risk debt stays catalogued (deferred to Version 2)
- Do not commit, push, or deploy from Chapter 16

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:technical-debt`, `npm run test:enterprise-regression`.
