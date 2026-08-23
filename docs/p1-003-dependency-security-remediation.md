# P1-003 — Dependency Security Remediation

**Date:** 2026-08-24  
**Finding:** P1-003 from `docs/final-production-certification-audit-v1.md`  
**Verdict:** **PASS**

## Before

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 7 |
| Moderate | 2 |
| Low | 0 |
| **Total** | **9** |

## Remediation

### Direct dependency bumps (patch/minor)

| Package | Before | After |
|---------|--------|-------|
| `next` | 15.5.19 | 15.5.23 |
| `eslint-config-next` | 15.5.19 | 15.5.23 |
| `@tailwindcss/postcss` | 4.3.1 | 4.3.3 |
| `tailwindcss` | 4.3.1 | 4.3.3 |
| `posthog-js` | 1.395.0 | 1.418.10 |

### `overrides` (transitive, compatibility-verified)

| Package | Target | Rationale |
|---------|--------|-----------|
| `postcss` | ^8.5.26 | Fixes GHSA path-traversal / XSS advisories in build chain |
| `sharp` | ^0.35.3 | Fixes libvips CVEs in Next.js image optimization |
| `nanoid` | ^3.3.18 | Fixes infinite-loop DoS in postcss dependency |
| `dompurify` | ^3.4.14 | Fixes XSS in PostHog client bundle |
| `js-yaml` | ^4.3.1 | Fixes quadratic CPU in ESLint config parsing (dev) |
| `fast-uri` | ^3.1.5 | Fixes host-confusion in Sentry/webpack ajv (build) |
| `brace-expansion` | ^1.1.18 / ^5.0.9 | Fixes DoS in minimatch (dev/build tooling) |

## After

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 0 |
| **Total** | **0** |

## Production exposure (pre-fix summary)

| Package | Verdict |
|---------|---------|
| `next` | **EXPLOITABLE** — Server Actions, rewrites, image opt in production |
| `postcss` | **POTENTIALLY EXPLOITABLE** — build-time; indirect via Next |
| `sharp` | **EXPLOITABLE** — image optimization API at runtime |
| `dompurify` | **REACHABLE BUT MITIGATED** — PostHog client only; CSP limits |
| `nanoid` | **NOT REACHABLE IN PRODUCTION** — CSS ID generation at build |
| `js-yaml` | **DEV/BUILD ONLY** — ESLint config load |
| `brace-expansion` | **DEV/BUILD ONLY** — glob/minimatch in tooling |
| `fast-uri` | **DEV/BUILD ONLY** — Sentry webpack plugin / ajv |

## Retired billing providers

No `stripe`, `paddle`, or `fastspring` npm packages in `package.json` or lockfile. Legacy script aliases remain as Mollie contract redirects only.

## Gates (all exit 0)

- `npm audit`, `npm ci`
- `npm run lint`, `typecheck`, `build`
- `test:production-readiness`, `test:definition-of-done`
- `test:enterprise-certification`, `test:enterprise-release-approval`
- `test:enterprise-production-golive`, `test:enterprise-regression`
- `test:mollie-billing` (249/249), `test:transactional-email` (41/41)

## Mollie safety

`MOLLIE_LIVE_CHARGING_ENABLED` remains default-off; LIVE gate, TEST path, and webhook contracts unchanged (249/249 billing tests pass).

## Release impact

Clears P1-003 blocker for controlled TEST pilot promote. Does not enable LIVE charging or alter billing/legal surfaces.
