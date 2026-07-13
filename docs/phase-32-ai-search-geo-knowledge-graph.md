# Phase 32 — AI Search, GEO & Knowledge Graph Optimization

**Status:** Production-ready  
**Date:** June 2025  
**Scope:** Public marketing surfaces, documentation, structured data, and AI discoverability only.

## Objective

Prepare Auroranexis for discovery and citation by AI search systems (ChatGPT, Google AI Overviews, Microsoft Copilot, Claude, Gemini, Perplexity) through a canonical entity model, linked JSON-LD knowledge graphs, GEO-readable content, documentation cross-linking, and `llms.txt`.

## Non-modified systems

Per phase constraints, the following were **not** changed:

- Authentication, RBAC, middleware, security model
- Stripe, billing, pricing logic or plan definitions
- Database schema, Supabase migrations
- OpenAI business logic, dashboard, APIs
- GA4, Microsoft Clarity, Search Console configuration

## Architecture

### Canonical entity model

`src/lib/seo/entity-graph.ts` is the single source of truth for:

| Entity | Purpose |
|--------|---------|
| `GRAPH_ENTITY_IDS` | Stable `@id` URIs for Organization, WebSite, SoftwareApplication, Product |
| `CANONICAL_CAPABILITIES` | Nine product capabilities (AI Operations Platform, Executive Reporting, Client Portal, Automation, Monitoring, Risk Management, Incident Management, Knowledge Base, Compliance) |
| `CANONICAL_SOLUTIONS` | Six public solution routes |
| `pageEntityId()` | Per-page `@id` for WebPage / TechArticle nodes |

### Linked JSON-LD (`@graph`)

`src/lib/seo/geo-schema.ts` builds connected graphs instead of isolated schema blobs:

- **Home:** Organization + WebSite + SoftwareApplication + visible FAQ
- **Pricing:** Product + WebPage (about → Product)
- **Landing pages:** WebPage + topic entity + BreadcrumbList + visible FAQ
- **Solution pages:** WebPage + Service + BreadcrumbList + visible FAQ
- **Hub pages:** CollectionPage + ItemList
- **Docs:** TechArticle + BreadcrumbList + visible FAQ (when present)

### GEO content

- **Definition sections** on landing and solution pages (`<dfn>` + business value)
- **Visible FAQs only** — FAQ schema emitted only where `MarketingFaq` or `<dl>` FAQ is rendered
- **Documentation cross-links** — `getDocMarketingLinks()` maps doc slugs to related feature/solution pages

### AI crawler guidance

- **`/llms.txt`** — factual public URL index, capability list, and accuracy policy (no certification claims)

## Audit summary

| Area | Before | After |
|------|--------|-------|
| Entity `@id` graph | Fragmented per-page schema | Shared `GRAPH_ENTITY_IDS` across pages |
| Hub pages (features, solutions, industries, use cases, docs, FAQ) | No JSON-LD | `collectionPageGraphJsonLd` |
| Security page | Visible FAQ, no schema | `faqJsonLd` aligned with visible FAQ |
| Docs | TechArticle only | TechArticle graph + breadcrumbs + FAQ + marketing cross-links |
| Homepage / pricing | Separate schema blobs | Unified `@graph` builders |
| Release notes | Hardcoded metadata | `createPageMetadataForPath` |
| `llms.txt` | Missing | App Router route at `/llms.txt` |

## Files changed

### New

- `src/lib/seo/entity-graph.ts`
- `src/lib/seo/geo-schema.ts`
- `src/lib/docs/marketing-cross-links.ts`
- `src/lib/seo/llms-txt.ts`
- `src/app/llms.txt/route.ts`
- `scripts/phase-32-ai-search-geo.test.mjs`
- `docs/phase-32-ai-search-geo-knowledge-graph.md`

### Modified

- `src/lib/company/company-schema.ts` — `@id`, `knowsAbout`, `featureList`, linked entities
- `src/lib/seo/index.ts` — exports entity graph and geo schema
- `src/components/marketing/landing-page-view.tsx` — graph JSON-LD + Definition section
- `src/components/marketing/solution-page-view.tsx` — graph JSON-LD + Definition section
- `src/components/marketing/landing-hub-view.tsx` — hub collection schema
- `src/components/docs/doc-page-layout.tsx` — related product pages
- `src/app/(marketing)/page.tsx` — `homePageGraphJsonLd`
- `src/app/(marketing)/pricing/page.tsx` — `pricingGraphJsonLd`
- `src/app/(marketing)/security/page.tsx` — FAQ schema
- `src/app/(marketing)/features/page.tsx` — collection schema
- `src/app/(marketing)/faq/page.tsx` — collection + FAQ schema
- `src/app/(marketing)/solutions/page.tsx` — hub path for schema
- `src/app/(marketing)/industries/page.tsx` — hub path for schema
- `src/app/(marketing)/use-cases/page.tsx` — hub path for schema
- `src/app/docs/page.tsx` — collection schema
- `src/app/docs/[slug]/page.tsx` — `docPageGraphJsonLd`
- `src/app/docs/release-notes/page.tsx` — registry metadata
- `package.json` — `test:phase-32` script

## Tests

```bash
npm run test:phase-32
npm run typecheck
npm run lint
npm run build
git diff --check
```

`test:phase-32` verifies:

- Entity graph consistency (capabilities, `@id` fragments)
- Company schema linkage
- `@graph` builders on key pages
- Visible FAQ ↔ schema alignment
- Documentation cross-links
- `llms.txt` accuracy policy
- No hidden FAQ on pricing/features

## Limitations

1. **No live crawl validation** — structured data correctness is source-tested, not submitted to Google Rich Results Test in CI.
2. **`llms.txt` is conventional** — not in sitemap; discoverable at `/llms.txt` per emerging AI crawler practice.
3. **FAQ hub uses fragment URLs** in ItemList (`/faq#topic`) — valid for on-page navigation, not separate pages.
4. **Enterprise / about / contact** retain existing Phase 30 schema patterns; not re-wired to `@graph` in this phase to minimize scope.
5. **Certification claims** remain explicitly disclaimed everywhere — AI systems must not infer SOC 2 / ISO 27001 certification.

## Owner checklist

- [ ] Run full validation suite locally or in CI
- [ ] Commit: `Phase 32 AI search GEO and knowledge graph optimization`
- [ ] Push to `origin/main`
- [ ] Confirm Vercel production deployment is Ready + Current
- [ ] Smoke test: `/`, `/features`, `/solutions`, `/faq`, `/security`, `/docs`, `/llms.txt`
- [ ] Optional: validate JSON-LD in [Google Rich Results Test](https://search.google.com/test/rich-results) for homepage and a landing page
- [ ] Monitor Search Console for structured data warnings (no expected regressions)

## Accuracy policy (for AI citation)

- Auroranexis is an **AI Operations Platform** for multi-client operators (MSPs, agencies, consultancies).
- **Pilot Partner** and **Founding Customer** programs are invite-only.
- **Enterprise pricing** is negotiated; public tiers are Professional, Business, and Enterprise.
- **Compliance readiness** is described without claiming SOC 2, ISO 27001, or other certifications unless explicitly published.
