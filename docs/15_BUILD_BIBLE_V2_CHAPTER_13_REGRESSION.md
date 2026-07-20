# Auroranexis Build Bible V2 — Chapter 13: Enterprise Regression & Release Confidence

**Status:** Implemented  
**Version:** 2.0 Chapter 13  
**Priority:** After Chapter 12 Paddle Billing

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch13-regression.mdc`.

## Sources of truth

| Concern | Location |
|---------|----------|
| Shared test helpers | `scripts/_test-helpers/read-source.mjs` |
| Enterprise matrix contracts | `scripts/enterprise-regression-matrix.test.mjs` |
| Regression runner | `scripts/run-enterprise-regression.mjs` |
| Suite catalog | `ENTERPRISE_REGRESSION_SUITE` in shared helpers |
| Chapter compliance | `scripts/build-bible-ch13.test.mjs` |
| E2E route lists | `e2e/helpers/routes.ts` |

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run test:build-bible-ch13` | Chapter 13 compliance contracts |
| `npm run test:enterprise-regression` | Full curated regression matrix (ch1–13 + domain suites) |
| `npm run test:paddle-billing` | Billing sole-provider suites |
| `npm run test:technical-seo` | SEO contracts |
| `npm run test:e2e` | Playwright browser QA (includes password-reset smoke) |

## Matrix coverage (source contracts)

- Authentication wiring (login/signup/reset)
- RBAC roles + module permissions
- Client / report / risk / incident instrumentation
- API v1 `withApiHandler` + scopes
- Paddle webhook + entitlements fail-closed
- Client portal isolation + a11y landmarks
- Automation / AI API gates
- SEO / a11y / i18n chapter suites available
- Settings billing + regional fields
- Error boundaries

## Non-negotiables

- Do not modify business logic, auth, RBAC, RLS, Paddle behaviour, or API contracts
- Prefer source-contract regression over live provider calls
- Consolidate helpers instead of duplicating `readSource`
- Do not redesign UI

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch13`, `npm run test:enterprise-regression`.

Do not commit, push, or deploy in Chapter 13 — Release chapters own shipping.
