# Phase 30.1 — Enterprise Technical SEO Foundation (Production Ready)

## Overview

Phase 30.1 hardens the Phase 30 SEO foundation for production readiness: single canonical metadata entry point across all public pages, expanded `PAGE_SEO` registry (auth, solutions, templates), About/Contact structured data, sitemap validation, webhook crawl blocking, English language alternates, and expanded automated regression tests.

No changes were made to authentication, RBAC, billing, Stripe, Supabase schema, AI engine, reports, client portal, dashboard functionality, business logic, pricing logic, or the security model.

## Audit Summary (Phases 1–15)

| Area | Status |
|------|--------|
| App Router metadata | Centralized via `createPageMetadataForPath()` |
| Canonical strategy | `https://www.auroranexis.com` for all public pages |
| Preview/localhost noindex | `isPreviewDeployment()` |
| Sitemap | Public routes only; `validateSitemapEntries()` |
| Robots | Shared `PRIVATE_ROUTE_PREFIXES` + www sitemap reference |
| Structured data | Organization, WebSite, SoftwareApplication, Product (pricing), TechArticle, FAQ, AboutPage, ContactPage |
| Fake SEO | None — no reviews, ratings, or fabricated claims |
| Analytics | GA4 + Clarity consent-gated (unchanged) |
| Internal links | Footer + features → solutions (unchanged) |

## Canonical Host Strategy

| Surface | Canonical |
|---------|-----------|
| Public marketing, legal, docs, solutions, templates | `https://www.auroranexis.com` |
| Authenticated workspace (`app.auroranexis.com`) | Served but metadata canonicalizes to www; layouts use `noindex` |

- Apex `auroranexis.com` → `www` (middleware + Vercel)
- Query-string URLs canonicalize to path-only alternates
- Preview (`VERCEL_ENV=preview`, `*.vercel.app`) → `noindex`

## Indexation Policy

**Indexable:** `PUBLIC_SITEMAP_ROUTES`

**Noindex:** `NOINDEX_ROUTES` (auth), `PRIVATE_ROUTE_PREFIXES`, preview hosts, 404

**Robots disallow:** dashboard, portal, API, webhooks, sales, workspace modules, onboarding, copilot, intelligence, billing, etc.

## Metadata System (Phase 30.1)

- All public marketing, legal, and auth pages use `createPageMetadataForPath(path)` — no per-page title/description overrides
- `PAGE_SEO` registry expanded with:
  - Auth routes (`/login`, `/signup`, `/forgot-password`, `/reset-password`)
  - Solution and template landing pages (from `SOLUTION_PAGES` / `TEMPLATE_PAGES`)
- Metadata includes: `metadataBase`, `applicationName`, `publisher`, canonical, `alternates.languages.en`, OpenGraph, Twitter, robots

## Structured Data

| Type | Where |
|------|-------|
| Organization, WebSite, SoftwareApplication, FAQPage | Homepage |
| Product (live plan prices) | `/pricing` |
| Service | `/enterprise` |
| TechArticle | `/docs/[slug]` |
| AboutPage | `/about` |
| ContactPage | `/contact` |
| BreadcrumbList | Enterprise, docs |

Forbidden types remain absent: Review, AggregateRating, fake awards, revenue claims.

## Sitemap & Robots

- `buildSitemapEntries()` — canonical www URLs, no synthetic `lastModified`
- `validateSitemapEntries()` — duplicate detection, private-route guard, host validation
- `buildRobotsConfig()` — `Sitemap: https://www.auroranexis.com/sitemap.xml`

## Files Changed

| File | Change |
|------|--------|
| `src/lib/seo/metadata.ts` | English `alternates.languages` |
| `src/lib/seo/routes.ts` | Auth + landing PAGE_SEO, `/webhooks` disallow |
| `src/lib/seo/structured-data.ts` | `webPageJsonLd`, `aboutPageJsonLd`, `contactPageJsonLd` |
| `src/lib/seo/sitemap.ts` | `validateSitemapEntries()` |
| `src/app/(marketing)/**` | Registry-only metadata |
| `src/app/(auth)/**` | Registry-only metadata |
| `src/app/(marketing)/about/page.tsx` | AboutPage JSON-LD |
| `src/app/(marketing)/contact/page.tsx` | ContactPage JSON-LD |
| `scripts/technical-seo.test.mjs` | 26 regression tests |

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run test:technical-seo
npm run test:openai-integration
```

## Google Search Console (Owner Actions)

1. Verify property for `https://www.auroranexis.com`
2. Submit `https://www.auroranexis.com/sitemap.xml`
3. Confirm apex redirect and preferred domain = www
4. Inspect key URLs: `/`, `/pricing`, `/features`, `/enterprise`, `/about`, `/contact`

## Production QA Checklist

- [ ] `robots.txt` references www sitemap and blocks `/dashboard`, `/api/`, `/webhooks`
- [ ] `sitemap.xml` contains only public www URLs
- [ ] Homepage canonical = `https://www.auroranexis.com`
- [ ] Auth pages return `noindex`
- [ ] About/Contact JSON-LD validates in Rich Results Test
- [ ] GA4 and Clarity fire only after consent
- [ ] No hydration or console errors on public pages

## Decision

**B — CODE COMPLETE — OWNER SEARCH CONSOLE + PRODUCTION DEPLOY VERIFICATION REQUIRED**

All acceptance criteria are met in code and automated tests. Production deploy and Search Console submission remain owner actions.
