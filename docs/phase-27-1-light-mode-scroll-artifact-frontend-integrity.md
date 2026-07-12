# Phase 27.1 — Light Mode Scroll Artifact & Frontend Integrity

Date: 2026-07-12

## Tester report

A tester reported red horizontal or vertical streaks/lines while scrolling in Light Mode on `auroranexis.com` / `app.auroranexis.com`.

Captured Console warning:

```
[cently:rd:site] failed to patch window.location setter
TypeError: Cannot redefine property: location
    at redirectionChainSiteScript.js
    at contentScript.js
```

## Error ownership

| Item | Classification | Owner |
|------|----------------|-------|
| `cently:rd:site` / `redirectionChainSiteScript.js` / `contentScript.js` | **B — Browser extension** | Cently browser extension |
| `Cannot redefine property: location` on `window.location` | **B — Browser extension** | Cently content script |
| Red scroll streaks (reported) | **Unreproduced in first-party audit** | Requires isolated tester reproduction |

### Repository proof — extension origin

Searched repository for:

- `redirectionChainSiteScript.js` — **0 matches**
- `contentScript.js` — **0 matches**
- `cently:rd:site` — **0 matches**
- `Cannot redefine property: location` — **0 matches**
- `Object.defineProperty(window.location` — **0 matches**

**Conclusion:** Auroranexis does not ship, reference, or patch `window.location`. The Cently warning cannot be repaired in application code. Do not suppress Console output or override browser globals.

## Reproduction matrix

| Route | Theme | Browser | Viewport | Red streaks | Horizontal overflow | First-party console errors |
|-------|-------|---------|----------|-------------|---------------------|----------------------------|
| `/pricing` | Light (emulated) | Chromium (Cursor) | 1905px desktop | **Not reproduced** | No | No |
| `/login` | Light (forced `html.light`) | Chromium (Cursor) | 1905px desktop | **Not reproduced** | No | No |
| `/` `/features` `/enterprise` `/status` | Not fully scrolled in browser automation | — | — | **Not reproduced** | Structural tests only | — |
| Dashboard / client / onboarding / adoption | Requires authenticated session | — | — | **Not tested live** | — | — |

**Notes:**

- Public marketing pages use `.marketing-theme` (dark navy shell) regardless of OS light mode.
- Dashboard Light Mode uses `html.light` class via user preferences.
- Red DOM elements (`#dc2626` / `rgb(220, 38, 38)`) were **not present** on tested public routes.
- Sticky/fixed surfaces with `backdrop-filter` exist (marketing header, cookie banner) but did not produce visible red artifacts in testing.

## Findings and root causes

### P0

None.

### P1 — Red line artifact

**Not reproduced.** No first-party root cause identified for red streaks. Cannot verify resolution.

### P2 — Proven first-party scroll/theme issues (addressed)

| Issue | Evidence | Fix |
|-------|----------|-----|
| Light `body` gradient visible behind dark marketing shell during overscroll | CDP on `/pricing`: `body` background `rgb(241, 245, 249)` while marketing shell is navy | `html:has(.marketing-theme) body { background-color: var(--color-secondary); background-image: none; }` |
| Missing explicit `color-scheme` on `html` | Computed `color-scheme: normal` in browser audit | `color-scheme: light` on `html`, `color-scheme: dark` on `html.dark` |

### P3 — Deferred

- `backdrop-filter` on sticky marketing header and cookie banner (common GPU compositing risk, not reproduced here)
- Cookie banner uses light tokens on dark marketing pages (intentional readability contrast)
- Decorative login panel `blur-md scale-105` (GPU-heavy, not linked to red artifact)

## Files changed

- `src/app/globals.css` — `color-scheme` + marketing body overscroll bleed fix

## Files created

- `docs/phase-27-1-light-mode-scroll-artifact-frontend-integrity.md`
- `scripts/light-mode-frontend-integrity.test.mjs`
- `e2e/light-mode-frontend-integrity.spec.ts`

## Files modified

- `package.json` — `test:light-mode-integrity` script
- `playwright.config.ts` — include light-mode e2e spec in chromium-smoke project

## CSS fixes

- Explicit `color-scheme` for light/dark HTML roots
- Marketing body background aligned to navy shell (no light gradient bleed)

## HTML / JavaScript fixes

None required — no invalid nesting or first-party `window.location` patching found.

## Tests

| Script | Result |
|--------|--------|
| `npm run test:light-mode-integrity` | 9/9 pass |
| `npm run typecheck` | pass |
| `npm run lint` | pass (pre-existing warnings only) |
| `npm run build` | pass |
| `git diff --check` | pass |

Playwright `e2e/light-mode-frontend-integrity.spec.ts` added (runs with `npx playwright test e2e/light-mode-frontend-integrity.spec.ts` when webserver available).

## Extension isolation — manual proof steps

1. Disable Cently extension → reload Auroranexis
2. Chrome Incognito with extensions disabled
3. Compare Console before/after — Cently messages should disappear
4. Compare scroll artifact before/after
5. If artifact persists only with Cently enabled → extension-side issue

## Unresolved limitations

- Red streak artifact not reproduced in automated or manual browser audit
- Authenticated dashboard scroll not tested without credentials
- GPU/driver-specific rendering may differ by tester hardware
- Vercel CLI not available in audit environment

## Manual tester checklist

1. Disable the Cently extension and reload Auroranexis.
2. Test in Chrome Incognito with extensions disabled.
3. Test Light Mode and Dark Mode.
4. Scroll the same long page quickly up and down.
5. Test with hardware acceleration enabled.
6. Test once with hardware acceleration disabled and Chrome restarted.
7. Test Chrome, Edge, and Firefox.
8. Test browser zoom at 100% and 125%.
9. Record a screen video showing the red lines and full browser window.
10. In Console, report only errors pointing to `app.auroranexis.com` or `auroranexis.com`, not extension scripts.
11. In Network, report first-party 4xx/5xx responses.
12. Provide browser version, OS, GPU, affected route, and whether lines disappear when scrolling stops.

## Final decision

**C. NOT REPRODUCED — NO SPECULATIVE CODE CHANGE** (for the reported red-line artifact)

Minor proven P2 theme/scroll fixes applied. Cently Console warning classified as external extension noise. Manual GPU/browser verification required from tester with extensions disabled.
