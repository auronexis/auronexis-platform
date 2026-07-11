# Phase 25.1 — Production Polish & Release Lock

Date: 2026-07-12

## Original Verified Production Issues

1. `GET /favicon.ico` returned HTTP 404 — browsers request this path by default.
2. Chrome DevTools reported at least two recognizable form fields without `autocomplete` attributes.

## Root Causes

### Favicon 404

The repository only served `public/favicon.svg`. Metadata and middleware referenced `/favicon.svg`, but browsers still request `/favicon.ico` independently. No `favicon.ico` file existed in `public/` or `src/app/`.

### Autocomplete warnings

Fields without semantic `autoComplete` values:

- `src/components/client-portal/create-portal-user-form.tsx` — `email` and `password` (recognizable autofill fields)
- `src/components/layout/global-search.tsx` — `type="search"` workspace search field

Additional hardening:

- `src/components/auth/reset-password-form.tsx` — explicit `new-password` on confirm field
- `src/components/compliance/compliance-workspace.tsx` — `email` on GDPR subject email field

Login, signup, forgot-password, portal login, and team invite already had correct values.

## Files Created

- `public/favicon.ico` — valid multi-size ICO (16, 32, 48) from approved `favicon.svg`
- `public/apple-icon.png` — 180×180 Apple touch icon
- `public/icon-512-compact.png` — 512×512 compact symbol for manifest/metadata
- `scripts/production-polish.test.mjs` — focused regression tests
- `docs/phase-25-1-production-polish-release-lock.md` — this document

## Files Modified

- `src/lib/branding/assets.ts` — canonical icon paths
- `src/lib/branding/icons.ts` — metadata and manifest icon SSOT
- `src/lib/branding/metadata.ts` — icon metadata block
- `src/components/client-portal/create-portal-user-form.tsx` — autocomplete
- `src/components/layout/global-search.tsx` — `autoComplete="off"`
- `src/components/auth/reset-password-form.tsx` — confirm password autocomplete
- `src/components/compliance/compliance-workspace.tsx` — subject email autocomplete
- `package.json` — `test:production-polish` script

## Favicon Implementation

Generated `public/favicon.ico` from the existing approved compact `public/favicon.svg` symbol (#0f2140 background, white mark). ICO contains 16×16, 32×32, and 48×48 PNG-encoded images.

## Application Icon Implementation

- Primary: `/favicon.ico`
- Vector fallback: `/favicon.svg`
- PWA/metadata 512: `/icon-512-compact.png` (compact symbol, not horizontal wordmark)

## Apple Touch Icon

`public/apple-icon.png` — 180×180 PNG generated from `favicon.svg`.

## Manifest Result

`src/app/manifest.ts` unchanged structurally; icon entries now reference existing assets via updated `PLATFORM_MANIFEST_ICONS`.

## Metadata Result

`PLATFORM_METADATA.icons` now references `/favicon.ico`, `/favicon.svg`, `/icon-512-compact.png`, and `/apple-icon.png`. Open Graph and Twitter metadata unchanged.

## Autocomplete Decisions

| Field | Value | Rationale |
|-------|-------|-----------|
| Portal user email | `email` | Recognized email autofill |
| Portal user password | `new-password` | Account creation flow |
| Workspace search | `off` | Internal search, not personal data |
| Reset confirm password | `new-password` | Password change flow |
| GDPR subject email | `email` | Recognized email field |

## Shared Input Changes

No changes required. `Input` already forwards `autoComplete` via `{...props}`.

## Tests Added

`scripts/production-polish.test.mjs` — 14 structural/asset/autocomplete regression tests.

## Auroranexis V1.0 — Sales-Ready Production Baseline

This phase establishes the stable **Auroranexis V1.0 sales-ready production baseline**.

- No additional broad speculative development phase should begin before customer feedback.
- Future work should be driven by real customer objections, support issues, onboarding friction, sales feedback, product usage, retention data, or verified defects.
- The next operational priority is **customer acquisition**.

Release-lock rules:

- Fix future bugs as isolated maintenance tasks.
- Preserve stable migrations, billing stability, tenant isolation, RBAC, and production QA discipline.
- Keep `main` production-safe.

## Remaining Manual Checks

1. Hard refresh `https://auroranexis.com` and confirm no `/favicon.ico` 404 in Network tab.
2. Chrome DevTools → Application → Manifest — confirm no icon errors.
3. Test login/signup/reset autocomplete behavior in browser.
4. F12 Console — confirm no new errors after deploy.

## Remaining Limitations

- Browser console/network QA requires authenticated manual session.
- ICO generation used build-time script locally; committed binary is the source of truth.
