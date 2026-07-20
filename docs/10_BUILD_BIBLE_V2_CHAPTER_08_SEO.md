# Auroranexis Build Bible V2 — Chapter 8: Enterprise SEO Audit & Search Optimization

**Status:** Implemented  
**Version:** 2.0 Chapter 8  
**Priority:** After Chapter 7 Performance

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch8-seo.mdc`.

## Sources of truth

| Concern | Location |
|---------|----------|
| Route classification | `src/lib/seo/route-catalog.ts` |
| Private / noindex policy | `src/lib/seo/private-routes.ts` |
| Metadata builder | `src/lib/seo/metadata.ts`, `PAGE_SEO` in `src/lib/seo/routes.ts` |
| Sitemap | `src/lib/seo/sitemap.ts`, `src/app/sitemap.ts` |
| Robots | `src/lib/seo/robots.ts`, `src/app/robots.ts` |
| Structured data | `src/lib/seo/structured-data.ts`, `src/lib/seo/geo-schema.ts`, `src/lib/company/company-schema.ts` |
| AI crawler guidance | `src/lib/seo/llms-txt.ts` |
| Host / X-Robots headers | `src/middleware.ts`, `src/lib/deployment/middleware-routing.ts` |

## Indexing policy

- **Indexable:** `public_website` routes only (marketing, legal, docs, landing pages)
- **Noindex:** authentication, dashboard, portal, settings, API, internal redirects, preview hosts
- **Robots disallow:** `PRIVATE_ROUTE_PREFIXES` + `NOINDEX_ROUTES`
- **X-Robots-Tag:** app hosts and private/auth paths on any host

## Non-negotiables

- Do not change auth, RBAC, RLS, Paddle billing, API contracts, dashboard/portal behaviour
- Do not invent reviews, ratings, or certifications in structured data
- Do not put private URLs in sitemap or llms.txt
- Prefer registry metadata (`createPageMetadataForPath`) for public pages

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:technical-seo`, `npm run test:build-bible-ch8`.

Do not commit, push, or deploy in Chapter 8 — Release chapters own shipping.
