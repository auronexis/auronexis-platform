# E2E Test Results — v0.99

**Version:** Auroranexis v0.99.0  
**Date:** 2025-06-23  
**Framework:** Playwright (`@playwright/test`)  
**Config:** `playwright.config.ts` (loads `.env.local` for `E2E_*` vars)

---

## Setup

```bash
npm install
npx playwright install chromium

# Add to .env.local (or export in shell)
E2E_EMAIL=owner@your-staging-domain.com
E2E_PASSWORD=your-test-password

# Full suite (builds + starts production server)
npm run test:e2e

# Reuse running dev server
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

Use a dedicated staging test account (or demo org owner). See [demo-tenant.md](./demo-tenant.md).

---

## Test suites

| Suite | File | Auth | Tests |
|-------|------|------|-------|
| Public smoke | `e2e/smoke.spec.ts` | No | 5 |
| Authenticated flows | `e2e/flows.spec.ts` | Yes | 13 |
| Staging module smoke | `e2e/staging.spec.ts` | Yes | 12 |
| **Total** | | | **30** |

Target for staging sign-off: **30/30 PASS** (0 skipped) with credentials configured.

---

## Validation run (2025-06-23, v0.99.0)

| Check | Result |
|-------|--------|
| `npm run lint` | **PASS** (pre-existing warnings only) |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** (102 routes) |
| `npm run test:e2e` (no credentials) | **5 passed**, 25 skipped |
| `npm run test:e2e` (with `E2E_EMAIL` + `E2E_PASSWORD`) | **30/30 expected** |

### Public smoke (no credentials)

```
ok  login page renders sign-in form
ok  signup page renders registration form
ok  protected dashboard redirects unauthenticated users
ok  client portal login renders
ok  health API returns JSON status
5 passed
```

### Authenticated + staging (credentials required)

All 25 tests skip with message: `Set E2E_EMAIL and E2E_PASSWORD`.

When credentials are set, expected **PASS** for all flow and staging module tests.

---

## CI integration

```yaml
- run: npm run build
- run: npx playwright install chromium --with-deps
- run: npm run test:e2e
  env:
    E2E_EMAIL: ${{ secrets.E2E_EMAIL }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
```

---

## Related

- [testing.md](./testing.md)
- [deployment-v0.99.md](./deployment-v0.99.md)
- [production-readiness-v0.99.md](./production-readiness-v0.99.md)
