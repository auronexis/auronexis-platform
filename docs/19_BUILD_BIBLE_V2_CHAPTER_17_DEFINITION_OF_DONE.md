# Auroranexis Build Bible V2 — Chapter 17: Enterprise Definition of Done & Release Gates

**Status:** Implemented  
**Version:** 2.0 Chapter 17  
**Priority:** Final engineering gate before Release Candidate process

This chapter verifies Enterprise Definition of Done across all prior Build Bible chapters. It does not add product features.

## Sources of truth

| Concern | Location |
|---------|----------|
| DoD checklist | `docs/enterprise-definition-of-done.md` |
| DoD audit report | `docs/enterprise-dod-report.md` |
| Release checklist | `docs/enterprise-release-checklist.md` |
| Production readiness | `docs/16_BUILD_BIBLE_V2_CHAPTER_14_PRODUCTION_READINESS.md` |
| Technical debt | `docs/technical-debt.md` |
| Chapter compliance | `scripts/build-bible-ch17.test.mjs` |
| DoD contracts | `scripts/definition-of-done.test.mjs` |

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run test:build-bible-ch17` | Chapter 17 compliance |
| `npm run test:definition-of-done` | DoD gate contracts |
| `npm run test:enterprise-regression` | Full catalog including Ch17 |

## Enterprise Definition of Done (summary)

Every shipped module must have:

1. Functional completeness (no unfinished workflows for the shipped scope)
2. Stable architecture aligned with Chapters 1–16
3. No placeholder module shells / Foundation v1 stubs in product UI
4. No `TODO` / `FIXME` / `HACK` in `src/`
5. Production error handling, validation, and authorization
6. Synchronized documentation
7. Passing enterprise regression suites

## Release recommendation policy

| Verdict | Meaning |
|---------|---------|
| **GO** | All DoD gates green; operator checklist only remaining |
| **GO WITH CONDITIONS** | Engineering DoD met with documented accepted limitations (debt catalog / graceful degradation) |
| **NO GO** | Incomplete modules, failing regression, or security blockers |

## Non-negotiables

- No feature development, redesign, or speculative refactoring in this chapter
- Do not modify business logic, auth, RBAC, RLS, Paddle behaviour, or API contracts except to clear proven DoD blockers (e.g. remove foundation placeholders)
- Do not commit, push, or deploy from Chapter 17

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:definition-of-done`, `npm run test:enterprise-regression`.
