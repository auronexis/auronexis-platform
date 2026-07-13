# Phase 31 — Content & Landing Pages (Enterprise)

Conversion-focused B2B landing page infrastructure for Auroranexis: feature pages, audience use cases, industry pages, FAQ hub, navigation IA, and internal linking.

## Summary

| Area | Deliverable |
|------|-------------|
| Feature pages | 14 pages at `/features/[slug]` |
| Audience pages | 9 pages at `/use-cases/[slug]` |
| Industry pages | 9 pages at `/industries/[slug]` |
| Hub pages | `/solutions`, `/industries`, enhanced `/features`, `/use-cases` |
| FAQ | `/faq` with 13 topic sections |
| Components | `LandingPageView`, `LandingHubView` |
| Navigation | Header: Features, Solutions, Industries, Enterprise, Pricing, Security, Documentation |
| CTAs | Extended presets: explore features, compare plans, view documentation, join pilot, enterprise inquiry |

## Architecture

Content-driven static generation pattern (same as existing solution pages):

```
src/lib/seo/feature-content.ts     → FEATURE_PAGES (14)
src/lib/seo/audience-content.ts    → AUDIENCE_PAGES (9)
src/lib/seo/industry-content.ts    → INDUSTRY_PAGES (9)
src/lib/seo/landing-page-types.ts  → shared LandingPageContent type
src/lib/seo/landing-page-builder.ts → buildLandingPage()
src/components/marketing/landing-page-view.tsx
src/components/marketing/landing-hub-view.tsx
```

Each landing page includes: problem, solution, business value, benefits, audience, enterprise advantages, capabilities, FAQ, related links, and conversion CTA.

## URL map

| Hub | Detail routes |
|-----|---------------|
| `/features` | `/features/ai-executive-reports`, `client-portal`, `automation`, … (14 total) |
| `/solutions` | existing `/solutions/*` capability pages (6) |
| `/use-cases` | `/use-cases/msps`, `marketing-agencies`, … (9 total) |
| `/industries` | `/industries/marketing`, `it`, `finance`, … (9 total) |
| `/faq` | topic-anchored FAQ sections |

## SEO

- All new routes registered in `PAGE_SEO` via `buildRegistrySeo()`
- Hub routes have static metadata in `routes.ts`
- `PUBLIC_SITEMAP_ROUTES` includes `FEATURE_ROUTES`, `USE_CASE_ROUTES`, `INDUSTRY_ROUTES`
- Pages use `createPageMetadataForPath()` and JSON-LD breadcrumbs + FAQ

## Enhanced pages

- `/integrations`, `/security`, `/compliance`, `/help` — CTAs, internal links, FAQ sections
- `/features` — links to all 14 feature pages + 6 solution pages
- Predictive intelligence CTA fixed: `/intelligence` → `/features/executive-dashboards`

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run test:phase-31
npm run test:technical-seo
```

## Constraints preserved

No changes to authentication, billing, Stripe, OpenAI, database, Supabase, APIs, business logic, routing middleware, or dashboard functionality.
