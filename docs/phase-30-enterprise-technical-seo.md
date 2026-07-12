# Phase 30 — Enterprise Technical SEO Foundation

## Overview

Phase 30 strengthens Auroranexis technical SEO without redesigning the product: canonical host consistency, centralized indexation policy, metadata registry usage, truthful structured data, sitemap/robots alignment, private-surface noindex, and automated regression tests.

## Architecture Reused

- `src/lib/seo/metadata.ts` — canonical metadata builder
- `src/lib/seo/routes.ts` — PAGE_SEO registry + indexation policy
- `src/lib/seo/sitemap.ts` + `src/app/sitemap.ts`
- `src/lib/seo/robots.ts` + `src/app/robots.ts`
- `src/lib/company/company-schema.ts` — JSON-LD entities
- `src/lib/seo/structured-data.ts` — page-level schema helpers
- `src/lib/branding/metadata.ts` — root platform metadata
- `src/lib/deployment/production-domains.ts` — host strategy
- Existing GA4, Clarity, consent, and CSP systems (unchanged)

## Canonical Host Strategy

| Surface | Canonical host |
|---------|----------------|
| Public marketing, legal, docs | `https://www.auroranexis.com` |
| Authenticated workspace | `https://app.auroranexis.com` (noindex) |

- Apex `auroranexis.com` redirects to `www` (existing Vercel/middleware rules)
- `resolveCanonicalBaseUrl()` always returns www for public metadata, sitemap, robots, and JSON-LD
- Full absolute canonical URLs in metadata (`alternates.canonical`)
- Preview deployments (`VERCEL_ENV=preview`, `*.vercel.app`) are `noindex`

## Indexation Policy

**Indexable:** routes in `PUBLIC_SITEMAP_ROUTES` (marketing, legal, solutions, templates, docs)

**Noindex via metadata:** auth routes, private prefixes, preview hosts

**Robots disallow:** `PRIVATE_ROUTE_PREFIXES` (dashboard, settings, client-portal, API, sales, workspace modules, onboarding, copilot, intelligence, etc.)

**Layout noindex:** dashboard, client portal, sales workspace

## Metadata System

- Expanded `PAGE_SEO` registry with unique titles/descriptions
- `createPageMetadataForPath()` preferred entry point
- `createMarketingMetadata()` delegates to registry (backward compatible)
- Absolute Open Graph and Twitter image URLs
- Search Console + Bing verification via existing env vars

## Structured Data

- Organization, WebSite, SoftwareApplication (multi-plan offers from billing registry)
- `pricingPageJsonLd()` on `/pricing` — Professional €149, Business €499, Enterprise €1499
- TechArticle JSON-LD on documentation pages
- FAQ schema only where visible FAQ exists (unchanged)
- No fake reviews, ratings, or certifications

## Sitemap

- Public routes only from `PUBLIC_SITEMAP_ROUTES`
- Canonical www base URL
- Removed synthetic `lastModified: new Date()` entries

## Robots.txt

- Shared `PRIVATE_ROUTE_PREFIXES` with metadata policy
- Allows `/`, disallows private prefixes
- References `${canonical}/sitemap.xml`
- Does not block assets (`/_next`, `/branding`)

## Redirects

No new redirects added. Existing apex→www and legacy `/legal/*` redirects preserved.

## Internal Linking

- Features page links to related solution pages
- Existing footer and homepage commercial links preserved

## Performance

No visual redesign. Preserved consent-gated GA4/Clarity, no duplicate script loaders.

## Analytics Compatibility

Added SEO-safe event names (where not already present):
- `organic_landing_view`
- `pricing_cta_clicked`
- `contact_sales_clicked`
- `documentation_viewed`

Existing `pricing_viewed`, `docs_viewed`, `signup_started`, `contact_clicked` unchanged.

## Tests

```bash
npm run test:technical-seo
```

## Owner Checklist

1. Confirm production canonical host is `www.auroranexis.com`
2. Confirm Search Console property matches www
3. Submit `https://www.auroranexis.com/sitemap.xml`
4. URL Inspection: homepage, pricing, one solution page
5. Verify GA4 real-time after consent
6. Verify Clarity after analytics consent
7. Confirm no private routes in sitemap
8. Confirm preview deployments are noindex
9. Rich Results Test on pricing and enterprise pages
10. Monitor Coverage and Core Web Vitals in Search Console

## Limitations

- Marketing pages still served from app subdomain alias; canonical tags point to www
- hreflang not added (no alternate language URLs)
- `llms.txt` not added (no product strategy requirement)
- Manual Rich Results and Search Console validation required post-deploy
