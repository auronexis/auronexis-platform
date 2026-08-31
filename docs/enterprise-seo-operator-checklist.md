# Enterprise SEO / Organic Search — Operator Checklist

**Audience:** Operators configuring Google Search Console, Bing Webmaster Tools, and IndexNow  
**Status:** Repository readiness documented — operator completion is separate  
**Canonical host:** `https://www.auroranexis.com`  
**Date context:** 2026-08-26  

Do **not** invent Search Console or Bing metrics. Mark each item complete only with operator evidence.

---

## Google Search Console

- [ ] Property for `https://www.auroranexis.com` (URL-prefix or Domain)
- [ ] Verify ownership (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` or DNS)
- [ ] Submit sitemap: `https://www.auroranexis.com/sitemap.xml`
- [ ] Review **Page indexing** — confirm private/auth routes are excluded or noindex
- [ ] **URL Inspection** priority list (after commercial/legal changes):
  - `/`
  - `/pricing`
  - `/features`
  - `/solutions`
  - `/resources`
  - `/enterprise`
  - `/security`
  - `/imprint`
  - `/refund-policy`
  - `/docs`
- [ ] Core Web Vitals / HTTPS / Manual actions / Security issues — monitor only; do not invent field data
- [ ] Track branded vs non-branded queries once data exists

---

## Bing Webmaster Tools

- [ ] Add and verify `https://www.auroranexis.com`
- [ ] Submit the same sitemap URL
- [ ] Configure IndexNow when `INDEXNOW_KEY` is set in Production (server-only; never `NEXT_PUBLIC_`)
- [ ] Confirm key file serves at `https://www.auroranexis.com/{INDEXNOW_KEY}.txt` (Option 1 root; required for site-wide urlList)
- [ ] Optional: cron/`/api/indexnow` already wired for authorized submission — do not fire on every pageview

---

## IndexNow (repository)

- Implementation: `src/lib/seo/indexnow.ts`, `src/app/api/indexnow/route.ts`, root key at `src/app/[file]/route.ts`
- `keyLocation` must be host-root `/{INDEXNOW_KEY}.txt` (Option 1) — `/.well-known/` as keyLocation causes IndexNow 422 for site-wide URLs
- Submits **canonical public indexable URLs only** (aligned with sitemap filters)
- Skips gracefully when `INDEXNOW_KEY` is unset
- Operator action: set Production secret + verify key file before relying on submissions

---

## Measurement (no invented baselines)

Track when available:

- Impressions, clicks, CTR, average position
- Indexed vs excluded pages
- Top queries / landing pages
- Pricing visits, pilot/contact starts (product analytics)

`SEARCH_VOLUME_DATA_NOT_AVAILABLE` and `FIELD_CWV_DATA_NOT_AVAILABLE` until real external/field evidence exists.

---

## Hard constraints

- Do not index dashboard, settings, billing internals, checkout, or portal private routes
- Do not enable Mollie LIVE charging from SEO work
- Do not invent ratings, reviews, certifications, or backlinks
