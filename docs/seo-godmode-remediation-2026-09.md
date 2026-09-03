# SEO Godmode Remediation — 3 September 2026

**Repository:** Auroranexis  
**Branch:** `main`  
**Starting SHA:** `4a01ebaad02e16bce8d99d3c27db7d534e7aba49`  
**Production host:** https://www.auroranexis.com  
**App host (noindex):** https://app.auroranexis.com  
**Scope:** Public marketing website only. No billing, Mollie, auth, RLS, push, or deploy.

---

## 1. Executive verdict and GSC baseline

**Verdict: READY_FOR_OPERATOR_INDEXING after deploy** (this commit is local only).

Google already understands Auroranexis as agency/MSP operations software. The site is not a blank slate. The bottleneck is **intent alignment and snippet quality**, not missing thousands of pages.

Operator GSC (3 months):

| Metric | Value | How to read it |
|--------|------:|----------------|
| Clicks | 7 | Demand is real but tiny; CTR cannot be optimized in isolation |
| Impressions | 430 | Google is testing the site on relevant queries |
| CTR | ~1.6% | Expected when avg position is deep on the SERP |
| Avg position | ~57.1 | **Not a standalone KPI** — mix of brand, legal, and deep-page queries |

Priority query:

| Query | Impressions | Clicks | Position | Landing URL |
|-------|------------:|-------:|---------:|-------------|
| automated client reporting | 72 | 0 | ~89.5 | `/solutions/ai-reporting` |

Google already associates that query with the reporting solution URL. Rank ~90 with 0 clicks means the page was a **weak match**: title/H1 said “AI-assisted reporting,” while the query is **automated client reporting**. This pass makes that URL the unambiguous primary for the cluster, using only shipped Reports-module capabilities (templates, generate, review, publish, schedules, PDF, portal, optional AI).

No new public URLs were created (5-point rule: existing page already ranks; inventing a second reporting URL would cannibalize).

---

## 2. Technical SEO audit (Phase 1)

### Indexable inventory (unchanged count)

Public sitemap still comes from `PUBLIC_SITEMAP_ROUTES` filtered by `isIndexablePublicRoute`, `isPrivateRoute`, and `NOINDEX_ROUTES`. Approximate buckets: marketing hubs, legal, features, use-cases, industries, 6 solutions, 5 templates, docs hub + articles. **No new indexable routes.**

### What was already solid

- Canonical origin is `https://www.auroranexis.com` (`PUBLIC_CANONICAL_ORIGIN` / `resolveCanonicalBaseUrl`).
- Preview/localhost/`.vercel.app` stay noindex (`isPreviewDeployment`).
- Dashboard, portal, settings, API, auth prefixes are private + robots disallow + layout `createPrivateAppMetadata`.
- Sitemap rejects private/noindex/non-www URLs (`validateSitemapEntries`).
- No `AggregateRating` / fake reviews in schema.
- Public pages use `createPageMetadataForPath` + `PAGE_SEO`.
- One H1 per marketing hero (`MarketingHero`).

### Findings remediated in this pass

| Finding | Severity | Action |
|---------|----------|--------|
| `/solutions/ai-reporting` titled/H1 as AI-assisted reporting while GSC query is automated client reporting | P0 | Rewrote title, H1, meta, body, FAQ |
| `/features/reports` competed for the same outcome language | P0 | Repositioned as workflow/how supporting page |
| Sitewide identical `keywords` meta on every page | P1 | Removed `DEFAULT_KEYWORDS` stuffing |
| Feature landings emitted extra `SoftwareApplication` JSON-LD | P1 | Features now `DefinedTerm`; one SoftwareApplication remains on home/pricing |
| Generic titles (About, Contact, Documentation, Help, Support) | P1 | Unique, specific titles + descriptions |
| Reporting internal anchors said “AI reporting” | P1 | Descriptive anchors to the solution URL |
| Sitemap `lastmod` | P2 | Still omitted — no truthful per-URL editorial dates; documented in code |
| `/documentation` vs `/docs` dual entry | P2 | Titles differentiated further; **do not merge in this pass** |

### Left as observations (not code)

- App vs www: middleware already noindexes app hosts; marketing canonicals stay www.
- CWV: no field data in this workspace (`FIELD_CWV_DATA_NOT_AVAILABLE`). Font `display: swap` already present. No speculative performance rewrite.
- `/documentation` remains a marketing index into `/docs` — watch GSC for cannibalization; merge only with a 301 after operator confirmation.

---

## 3. Query-to-page intent map (Phase 2) — Clusters A–E

**Rule:** one primary destination per cluster. Supporting URLs reinforce; they do not reuse the primary H1.

Implemented in `src/lib/seo/intent-ownership.ts` (`SEARCH_INTENT_CLUSTERS`). Unique `primaryPath` values are regression-tested.

| Cluster | GSC / observed query evidence | Intent | Primary URL | Supporting URLs | Why this owner |
|---------|-------------------------------|--------|-------------|-----------------|----------------|
| **A** | automated client reporting (72/0/~89.5); automated reporting for clients; ai-assisted reporting; ai strategic executive reporting | Outcome: recurring client reports from ops data | `/solutions/ai-reporting` | `/features/reports`, `/features/ai-executive-reports`, `/templates/executive-report`, `/docs/reports` | Google already landed here; solution page is the outcome URL |
| **B** | agency operations automation software (~38) | Workflow automation inside the ops workspace | `/features/automation` | `/features/monitoring`, `/use-cases/automation-agencies`, `/features` | Shipped automation builder; home remains platform hub |
| **C** | client and portfolio profitability reporting (~36) | Margin/effort visibility, not accounting | `/features/profitability` | `/features/executive-dashboards`, `/features/customer-success`, `/docs/profitability` | Only dedicated profitability surface |
| **D** | managed services portfolio (~16) | MSP persona / portfolio ops | `/use-cases/msps` | `/use-cases/it-service-providers`, `/industries/it`, `/use-cases` | Persona page; not a new “MSP software” doorway |
| **E** | incident management sla (~12) | Incidents with SLA context | `/solutions/incident-management` | `/features/incidents`, `/solutions/sla-management`, `/templates/incident-response`, `/features/monitoring` | Existing solution already owns incidents+SLA; SLA policy stays on `/solutions/sla-management` |

Other existing clusters (health, risk, SLA-as-policy, executive dashboard, portal, pricing, security, resources hub) stay as previously mapped. Do **not** optimize every page for every observed query.

Homepage `/` remains the platform primary for “AI agency / MSP operations command center.”

---

## 4. Content and metadata remediations (Phases 3–5, 10, 14)

### Priority URL — `/solutions/ai-reporting`

- **Title / H1:** Automated client reporting for agencies and MSPs  
- **Meta:** templates, scheduled drafts, generate-from-workspace data, PDF, portal, optional AI with human review  
- **Architecture:** what it is, problem, who, how it works (template → generate → review → publish → schedule drafts), benefits, capabilities, genuine FAQ  
- **Product truth only:** draft/generated/published/archived; templates; Generate; portal/PDF/email; schedules create drafts not unattended client sends; AI optional  

CTR/snippet aim: query terms appear in title and first description clause without exact-match spam across the rest of the site.

### Differentiation

| URL | Role after this pass |
|-----|----------------------|
| `/solutions/ai-reporting` | Outcome: automated client reporting |
| `/features/reports` | How: templates, schedules, publication workflow |
| `/features/ai-executive-reports` | AI-assisted leadership briefings (facts vs recommendations) |
| `/solutions/executive-dashboard` | Live portfolio command center, not a scheduled client PDF |

### Other indexable titles

Static `PAGE_SEO` titles for About, Contact, Documentation index, Help, and Support were made specific so they no longer look like duplicate stubs.

Heading architecture: solution pages keep a single H1; H2s are crawlable HTML (`MarketingSection`), not canvas/JS. FAQ remains visible `<details>` plus FAQPage JSON-LD only where questions are on-page.

---

## 5. Internal linking (Phase 6)

Descriptive anchors, not exact-match spam on every page.

- Homepage “What is Auroranexis?” now links health, risk, **automated client reporting**, incident+SLA, MSP portfolio, profitability reporting, agency automation, pricing.
- Homepage feature card “Client Reporting” CTAs to `/solutions/ai-reporting`.
- Features hub solution list uses “Automated client reporting.”
- Solution related links mesh health ↔ risk ↔ incidents ↔ SLA ↔ dashboard ↔ reporting.
- Resource pillar “SLA management & client reporting” primary href is the reporting solution; SLA remains a sibling link.
- MSP use-case and several industry/audience pages link the reporting solution.
- Docs marketing cross-links label updated.

No paid backlinks, directories, or comment spam.

---

## 6. Structured data (Phase 7)

| Type | Where | Notes |
|------|-------|--------|
| Organization, WebSite, SoftwareApplication | Homepage graph | Unchanged product/offer truth; EUR offers stay on pricing graph — **not edited** |
| BreadcrumbList | Solution + landing pages | Visible trail matches JSON-LD |
| FAQPage | Solution/landing FAQs | Only questions rendered on the page |
| Service | Solution pages | Named after the visible solution |
| DefinedTerm | Feature landings | Replaces per-feature SoftwareApplication |
| CollectionPage | Hubs | Unchanged pattern |

**Not added:** fake ratings, reviews, awards, certifications, invented offers.

---

## 7. Indexation, sitemap, robots, canonicals (Phases 8–9)

- Canonical host: www only.  
- Sitemap: public routes, www URLs, no dashboard/login/API.  
- `/solutions/ai-reporting` sitemap priority raised to 0.9 (with home/pricing/pilot).  
- **lastmod:** omitted on purpose (untruthful `new Date()` is banned by existing tests). After deploy, GSC will recrawl on content change; operators may set lastmod later if a real editorial timestamp source exists.  
- Robots: allow `/`, disallow private prefixes + auth noindex routes.  
- Login/signup/forgot/reset remain `NOINDEX_ROUTES`.  
- Noindex private layouts unchanged.

---

## 8. Priority backlog P0–P3

### P0 (done in this commit)

- Align `/solutions/ai-reporting` to “automated client reporting.”  
- Stop `/features/reports` from using the same outcome title.  
- Intent map clusters A–E with unique primaries.  
- Regression tests for the above.

### P1 (done)

- Unique titles/descriptions for thin static pages.  
- Internal link graph + descriptive anchors.  
- Remove sitewide keywords meta.  
- Stop feature-level SoftwareApplication JSON-LD.  
- Solution page problem/who/how sections.

### P2 (operator / later)

- Request indexing in GSC for URLs in section 10 after production deploy.  
- Monitor cannibalization: `/documentation` vs `/docs`, `/features/reports` vs solution (should decline).  
- Consider 301 `/documentation` → `/docs` only after GSC query inspection.  
- Add truthful lastmod if git/editorial dates are wired.

### P3 (do not do now)

- City/competitor doorway pages.  
- Mass blog / thin keyword URLs.  
- Invented testimonials, stats, ISO/SOC claims.  
- Translating the marketing site.  
- Changing pricing/Mollie copy for SEO.

**New pages:** none. 5-point rule failed for extra URLs (existing page already indexed; intent overlap; no unique capability).

---

## 9. Validation evidence (Phases 12, 15)

Commands (local):

- `npm run test:seo-godmode`
- `npm run test:technical-seo`
- `npm run test:build-bible-ch8`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Tests live in `scripts/seo-godmode.test.mjs` using `scripts/_test-helpers/read-source.mjs`, also invoked from `test:technical-seo` and `ENTERPRISE_REGRESSION_SUITE`.

Repo search: no marketing canonicals pointing at localhost/staging; app host is not the public canonical; private routes remain noindex.

Browser/HTTP against **production** still reflects the previous deploy until operators ship this commit. Local source contracts cover title/H1/canonical builders.

---

## 10. Operator post-deploy actions

**Do not treat this local commit as live SEO.** After production promote:

1. Confirm live HTML on:
   - https://www.auroranexis.com/
   - https://www.auroranexis.com/solutions/ai-reporting
   - https://www.auroranexis.com/features/reports
   - https://www.auroranexis.com/pricing  
   Check: `<title>`, meta description, `link rel="canonical"` (www), robots index, one H1, JSON-LD, internal links.
2. Submit or recrawl sitemap: https://www.auroranexis.com/sitemap.xml in Google Search Console (and Bing if used).
3. **URL Inspection → Request indexing** (priority order):
   1. `/solutions/ai-reporting`
   2. `/`  
   3. `/features/automation`
   4. `/features/profitability`
   5. `/use-cases/msps`
   6. `/solutions/incident-management`
   7. `/features/reports` (supporting — so Google reclassifies it)
4. In GSC Performance, filter query `automated client reporting` and confirm it still maps to `/solutions/ai-reporting` (not `/features/reports`).
5. Do not chase global average position. Track cluster A impressions, clicks, and landing-page association.

**Sitemap action required:** yes, after deploy — resubmit sitemap and request indexing on the URLs above.

**E-E-A-T:** existing legal entity, imprint, DPA, subprocessors, security posture, and “no certification claimed” language retained. Testimonials remain representative priorities, not named customers.

---

## Change control

| Rule | Status |
|------|--------|
| No Mollie / pricing / subscription logic | PASS |
| No auth / RLS | PASS |
| No fake social proof | PASS |
| No new doorway URLs | PASS |
| No push / deploy from this work | PASS (local commit only) |
| Chapter 8 index policy preserved | PASS |
| Chapter 9 money formatters untouched | PASS |
