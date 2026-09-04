# P0 — SEO authenticated layout regression remediation

Date: 2026-09-04  
Branch: `main`  
Known-good SHA: `4a01ebaad02e16bce8d99d3c27db7d534e7aba49`  
Regression SHA (accused): `8d662a16c8a2804ed85f69dbd4990e243a8405c1`  
Starting HEAD: `8d662a16c8a2804ed85f69dbd4990e243a8405c1`

## 1. EXACT ROOT CAUSE

**No authenticated-shell layout regression was introduced by `8d662a1`.**

Git forensics prove the SEO GODMODE commit does not modify any shared authenticated layout, global CSS, app shell, footer variant wiring, or semantic wrappers used by the dashboard route group.

Live production reproduction against `https://app.auroranexis.com` (E2E credentials) after sidebar client navigation shows a healthy shell:

- single `#main-content`
- no `.marketing-theme`
- `DashboardShell` `h-screen overflow-hidden` retained
- `SiteFooter variant="minimal"` only (not marketing megabar)
- main column left offset `256px` beside `256px` sidebar across Dashboard → Clients → Settings → Dashboard

Therefore the P0 cannot be attributed to an SEO structural/style change in `4a01eba..8d662a1`. No responsible SEO layout delta exists to revert or “isolate.”

## 2. EXACT FILE + LINE/COMPONENT RESPONSIBLE

**None in `4a01eba..8d662a1` for authenticated layout.**

Blob identity (identical before/after SEO commit):

| File | Blob SHA (both commits) |
|------|-------------------------|
| `src/components/layout/dashboard-shell.tsx` | `93ed8ce2b1e1dbc87c6343b2e29e0ce4fe24cfaf` |
| `src/components/layout/dashboard-sidebar.tsx` | `3ffcbc3dcb7ff4b261359a274470063d32749b81` |
| `src/components/layout/site-footer.tsx` | `ca5f5add82acfb2a45bf0bec9c837ddad861d010` |
| `src/app/globals.css` | `b54e2c0b3024f06d8fa35e8e29dda3e36764f440` |
| `src/app/(dashboard)/layout.tsx` | `b05247ad6edc29f9d5c4ad22c5dc69dd4040830a` |

Accused commit only changed marketing/SEO content, metadata copy, schema, tests, and docs.

## 3. Why commit `8d662a1` was suspected

- Deploy timing: production deployment ~21:48 local on 2026-09-03, shortly after the SEO commit (`21:27`).
- SEO work expanded public solution pages (`MarketingSection` density / taller marketing pages) — visible on public routes such as `/solutions/ai-reporting` (`min-h-screen` marketing shell + large marketing footer). That is expected marketing behavior, not the authenticated app shell.

## 4. Why `4a01eba` did not “have” a different app shell

Because the authenticated shell sources are byte-identical at `4a01eba` and `8d662a1`. There is no shell delta to explain a post-SEO authenticated layout break.

## 5. Routes affected

**None proven for authenticated app.**

Validated live (hard load + client sidebar navigation):

- `/dashboard`
- `/clients`
- `/settings`
- `/settings/plans` (authenticated Pricing nav target)
- round-trip: marketing `/solutions/ai-reporting` → `/dashboard` → `/clients`

## 6. Files changed (this remediation pass)

| File | Change |
|------|--------|
| `scripts/dashboard-bottom-layout.test.mjs` | Added source-contract: authenticated shell must not mount `MarketingShell` / `marketing-theme` / marketing footer variant |
| `docs/p0-seo-authenticated-layout-regression-remediation.md` | This report |

No product/layout code changes — none were justified by the diff.

## 7. SEO behavior changed?

**No product SEO behavior was altered by this incident response.**

Public SEO improvements from `8d662a1` remain intact (intent ownership, solution page content, metadata keywords policy, JSON-LD DefinedTerm adjustment, tests).

## 8. Typecheck result

Skipped — no product/layout code change requiring a full typecheck gate for this incident conclusion.

## 9. Lint result

Skipped — no product/layout code change.

## 10. Build result

Skipped — no product/layout code change. Production already serves `8d662a1` with a healthy authenticated shell under live navigation checks (§12).

## 11. SEO test result

| Command | Result |
|---------|--------|
| `npm run test:dashboard-bottom-layout` | **5/5 pass** (includes new isolation assertion) |
| `npm run test:seo-godmode` | **9/9 pass** |
| `npm run test:technical-seo` | **64/64 pass** |

## 12. Authenticated navigation validation

Playwright against production (`1440×900` and `1280×800`):

| Step | Result |
|------|--------|
| Hard-load `/dashboard` | PASS — shell healthy, no marketing theme |
| Client nav → `/clients` | PASS — `mainLeft=256`, `asideW=256` |
| Client nav → `/settings` | PASS |
| Client nav → `/settings/plans` | PASS |
| Client nav → `/dashboard` | PASS |
| Marketing visit then return + sidebar nav | PASS — marketing theme cleared; app shell restored |
| Marketing footer in app | FAIL to observe — only `SiteFooter` minimal classes present |
| Giant empty navy content column | FAIL to observe — only expected sidebar navy |

Evidence artifacts (local, untracked): `.recert-evidence/p0-*.png`, `.recert-evidence/p0-layout-*.mjs`.

### Related pre-existing observations (not caused by `8d662a1`)

1. Cookie consent first paint can report `data-consent-surface="public"` until `useEffect` detects `#dashboard-root` (known class of issue; remediated previously for authenticated card layout; flash still possible).
2. Authenticated minimal footer still lists many legal/company links (`FOOTER_LINKS`) — compact, but denser than a one-line chrome strip. This is unchanged across the accused range.
3. Historical navy bottom megabar was fixed in `9254251` (`fix: remove global bottom layout obstruction`) long before SEO GODMODE.

## 13. `git diff --stat` (accused range)

```
docs/seo-godmode-remediation-2026-09.md         | 260 ++++++++++++++++++++++++
package.json                                    |   3 +-
scripts/_test-helpers/read-source.mjs           |   1 +
scripts/phase-32-ai-search-geo.test.mjs         |   2 +-
scripts/seo-godmode.test.mjs                    | 143 +++++++++++++
src/app/(marketing)/features/page.tsx           |   2 +-
src/app/(marketing)/page.tsx                    |  22 +-
src/app/(marketing)/solutions/page.tsx          |   2 +-
src/components/marketing/solution-page-view.tsx |  33 ++-
src/lib/docs/marketing-cross-links.ts           |   2 +-
src/lib/marketing/content.ts                    |   6 +-
src/lib/seo/audience-content.ts                 |   5 +-
src/lib/seo/entity-graph.ts                     |   8 +-
src/lib/seo/feature-content.ts                  |  44 ++--
src/lib/seo/geo-schema.ts                       |  23 ++-
src/lib/seo/industry-content.ts                 |   2 +-
src/lib/seo/intent-ownership.ts                 |  32 ++-
src/lib/seo/landing-content.ts                  | 155 +++++++++++---
src/lib/seo/llms-txt.ts                         |   2 +-
src/lib/seo/metadata.ts                         |  14 +-
src/lib/seo/resource-pillars.ts                 |   9 +-
src/lib/seo/routes.ts                           |  22 +-
src/lib/seo/sitemap.ts                          |   5 +-
 23 files changed, 681 insertions(+), 116 deletions(-)
```

Zero hits on `dashboard-shell`, `site-footer`, `(dashboard)/layout`, `globals.css`.

## 14. Final local commit

| Field | Value |
|-------|--------|
| Message | `test: lock marketing shell out of authenticated app shell` |
| Contents | Incident report + authenticated-shell ↔ marketing isolation source contract |
| Push | **Not performed** |

Verify SHA with `git log -1 --format=%H` on `main` (evidence commit is tip; do not push).

No `fix: isolate seo layout changes from authenticated app shell` commit was made — forensics found no SEO layout delta to isolate.

Product baseline remains `8d662a16c8a2804ed85f69dbd4990e243a8405c1`; this tip only adds the report + isolation test.

## FINAL VERDICT

**P0_UI_REGRESSION_NOT_FIXED**

Clarification: “NOT_FIXED” here means **no SEO-introduced authenticated layout defect was found to fix**. The accused commit did not alter the authenticated app shell; live navigation validation did not reproduce a giant blank navy content defect inside the authenticated shell.

Push: **not performed**  
Deploy: **not performed**

### Operator next steps if symptoms persist

1. Capture a viewport screenshot (not full-page) immediately after the failing sidebar click, with URL + viewport size.
2. Confirm whether the navy region is the **sidebar** vs a full-width marketing shell (`bg-secondary` / `.marketing-theme`).
3. Note browser extensions (prior Phase 27.1 scroll-artifact work found extension interference).
4. If a reproducible DOM tree is provided showing `.marketing-theme` or `SiteFooter variant="marketing"` under `#dashboard-root`, reopen as a new P0 with that evidence.
