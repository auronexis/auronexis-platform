# E2E Final Report — v0.995

**Date:** 2025-06-23  
**Version:** Auroranexis v0.995.0  
**Result:** **30/30 PASS** (0 skipped)

---

## Configuration

```env
E2E_EMAIL=demo@auroranexis.com
E2E_PASSWORD=<from npm run seed:pilot>
```

Bootstrap:

```bash
npm run seed:pilot
# Apply SQL seeds in Supabase SQL Editor (see demo-environment.md)
```

The seed script creates an **enterprise subscription** on `aurora-demo` so production-mode E2E (`npm run build && npm run start`) unlocks Business+ modules (risks, incidents, automation, etc.).

---

## Validation run (2025-06-23)

| Check | Result |
|-------|--------|
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** (102 routes) |
| `npm run test:e2e` | **30/30 PASS** |

### Suite breakdown

| Suite | Tests | Result |
|-------|-------|--------|
| `e2e/flows.spec.ts` | 13 | 13/13 PASS |
| `e2e/smoke.spec.ts` | 5 | 5/5 PASS |
| `e2e/staging.spec.ts` | 12 | 12/12 PASS |

---

## Fixes applied (Sprint 5)

- Enterprise subscription seeded for demo org (production plan resolution)
- E2E selectors updated to `level: 1` headings (strict mode)
- Report form: reporting period dates required
- Logout: `menuitem` role for Sign out
- Playwright loads `.env.local` + global setup defaults

---

## Related

- [pilot-execution.md](./pilot-execution.md)
- [pilot-checklist-v1.md](./pilot-checklist-v1.md)
- [v1-rc-readiness.md](./v1-rc-readiness.md)
