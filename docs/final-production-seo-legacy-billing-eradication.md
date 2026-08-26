# Final Production SEO Integrity + Legacy Billing Provider Eradication

**Date:** 2026-08-26  
**Branch:** `main`  
**HEAD (pre-commit baseline):** `b8fd166775dbaca606e88faea7bf1fa8d8dedf5b`  
**Working tree:** clean at start of this pass  
**Production:** https://www.auroranexis.com · App: https://app.auroranexis.com  
**Authoritative billing:** Auroranexis (control plane) + Mollie (PSP only)  
**LIVE charging:** unchanged — `MOLLIE_LIVE_CHARGING_ENABLED=false` (not enabled)

---

## 1. Executive verdict

**VERDICT: READY_FOR_OPERATOR_REVIEW**

- ACTIVE FastSpring / Stripe / Paddle checkout & runtime providers = **0**
- Critical SEO defects found in code were fixed; no remaining critical blockers in-repo
- Mollie integrity, entitlements, and pilot access contracts pass regression
- Lint / typecheck / enterprise regression / legacy-removal / SEO / Mollie billing / build = PASS
- No push, no deploy, no live charge, no secret exposure

---

## 2. Baseline (Phase 0–1)

| Item | Value |
|------|-------|
| Branch | `main` (up to date with `origin/main`) |
| Node | v24.17.0 |
| npm | 11.13.0 |
| Next.js | ^15.5.23 |
| Dirty unrelated work | None — clean tree |
| Pre-existing gate status | Legacy removal 14/14, technical SEO 38/38, Mollie billing 321/321 already green before this pass |

---

## 3. Forensic search method (Phase 2–4)

Case-insensitive repository search for `fastspring` / `stripe` / `paddle` and variants.  
Classification applied per match (A–L). Eradication targeted **ACTIVE** surfaces A–I toward zero; historical migrations and historical audit docs retained with labels.

---

## 4. Classification legend

| Code | Meaning |
|------|---------|
| A | Active runtime checkout / webhook processing |
| B | Active UI brand / operator copy |
| C | Active env keys in examples/diagnostics |
| D | Active package dependency / SDK |
| E | Active CI / npm script pretending legacy is current |
| F | Dead but mountable product code |
| G | Active public marketing/legal/docs claims |
| H | Active SEO structured-data / indexable claims |
| I | Active operator go-live instructions treating legacy as current |
| J | Historical DB columns / types / archive detection helpers |
| K | Historical migrations (`HISTORICAL_MIGRATION_REQUIRED`) |
| L | Historical docs / Build Bible archives (superseded banners) |

---

## 5. Eradication actions (ACTIVE → ZERO)

| Action | Result |
|--------|--------|
| Delete `src/lib/fastspring/**` | Done — dead checkout/webhook/sync/test modules removed |
| Delete `fastspring-test-checkout-panel.tsx` | Done — unmounted dead UI |
| Delete `scripts/fastspring-*.test.mjs` (4) | Done — obsolete suites asserting dead code |
| Remove `test:fastspring-*` npm scripts | Done |
| Strip `FASTSPRING_` / `PADDLE_` / `STRIPE_` keys from `.env.example` | Done — prose-only retirement note remains |
| Keep `/api/fastspring/*` | **410 Gone** tombstones (intentional) |
| Keep `/settings/billing/fastspring-test` | Redirect → Mollie test |
| Keep historical row detectors | `isFastSpringBackedSubscription` etc. — prevent double-billing |

---

## 6. Historical migrations (Phase 5)

Retained without mutation:

- `supabase/migrations/20250623290000_stripe_billing.sql`
- `supabase/migrations/20250717000000_paddle_billing.sql`
- `supabase/migrations/20250718160000_paddle_billing_v2_stripe_archive.sql`
- `supabase/migrations/20250726120000_fastspring_webhook_foundation.sql`
- Mollie migrations that mention legacy provider enums in CHECK constraints

**Classification:** `HISTORICAL_MIGRATION_REQUIRED`  
**New forward migration:** none — no proven safe/necessary dead-schema drop.

---

## 7. Dependency eradication (Phase 6)

| Check | Result |
|-------|--------|
| `@mollie/api-client` | Present (sole billing SDK) |
| `@paddle/*` / `stripe` packages | Absent |
| Lockfile change required | No |

---

## 8. Environment variables (Phase 7)

| Status | Notes |
|--------|-------|
| Removed from `.env.example` as settable names | `FASTSPRING_*`, `PADDLE_*`, `STRIPE_*`, `NEXT_PUBLIC_STRIPE_*`, `NEXT_PUBLIC_PADDLE_*` |
| Keep | `MOLLIE_API_KEY`, rollout/allowlist, `MOLLIE_LIVE_CHARGING_ENABLED=false` |
| Operator action | Remove any retired provider secrets still present in Vercel Production |

---

## 9. Routes / webhooks (Phase 8)

| Route | Status |
|-------|--------|
| `/api/mollie/webhook` | **ACTIVE** |
| `/api/mollie/connectivity` | **ACTIVE** |
| `/api/fastspring/webhook` | **410** tombstone |
| `/api/fastspring/connectivity` | **410** tombstone |
| `/api/stripe/*` | Does not exist |
| `/api/paddle/*` | Does not exist |

---

## 10. Mollie + pilot integrity (Phases 9–10)

| Gate | Result |
|------|--------|
| `getActiveBillingProvider()` → `"mollie"` | PASS |
| Checkout eligibility never falls back to legacy | PASS |
| Org sync refuses FastSpring/legacy overwrite | PASS |
| Entitlements via `resolveOrganizationEntitlements` | PASS (source contracts) |
| Pilot / LIVE gate fail-closed | PASS |
| Live charging changed | **NO** |

---

## 11. Public content billing truth (Phase 11)

Public legal + product docs + marketing sources name **Mollie** as PSP; Auroranexis remains seller.  
No FastSpring / Stripe / Paddle / MoR as current public facts (guarded by `test:legacy-billing-removal` + `test:technical-seo`).

---

## 12–26. SEO integrity (evidence-backed fixes)

### Defects fixed

1. **Title cannibalization** — marketing vs docs for Security / Compliance / Integrations  
   - Marketing titles differentiated in `src/lib/seo/routes.ts`  
   - Docs registry titles → `* documentation` in `src/lib/docs/registry.ts`
2. **Feature vs solution H1/title clash** — incident pages  
   - Solution title → `Client portfolio incident response with SLA tracking`
3. **Separate docs/status hosts** — `docs.auroranexis.com` / `status.auroranexis.com`  
   - `EXTERNAL_LINKS` now point to www `/docs` and `/status`  
   - Removed redundant “external docs site” links from marketing/docs hubs
4. **App host crawl endpoint leak** — `robots.txt` / `sitemap.xml` excluded from middleware matcher  
   - Matcher now includes them so app → www marketing redirect applies

### Confirmed PASS (unchanged)

| Area | Status |
|------|--------|
| Canonical www | PASS |
| Sitemap registry (98 unique public URLs) | PASS |
| Robots + private noindex | PASS |
| SoftwareApplication SaaS schema + EUR | PASS |
| No Product / Merchant Listing theatre | PASS |
| No AggregateRating / fake reviews | PASS |
| Apex → www / app marketing → www | PASS (code) |
| llms.txt conservative | PASS |

### Counts

| Metric | Value |
|--------|-------|
| Public URLs checked (sitemap registry) | **98** |
| Defects fixed | **4** |
| Blockers remaining (in-repo critical) | **0** |
| Canonical conflicts | **0** |
| Sitemap path conflicts | **0** |
| Broken internal public links introduced | **0** |

### Live operator verification still recommended

- Apex → www HTTP 308 in production DNS/Vercel Domains (no double-redirect)
- `https://app.auroranexis.com/robots.txt` and `/sitemap.xml` redirect to www after deploy
- Rich Results / GSC for updated titles after deploy

---

## 27–28. Strengthened guards

- `scripts/legacy-billing-provider-removal.test.mjs` — ACTIVE runtime eradication, env key ban, Mollie-only provider
- `scripts/technical-seo.test.mjs` — title differentiation, www docs/status, middleware matcher, SaaS/EUR schema
- Related sole-provider / production-readiness env assertions updated for eradicated keys

---

## 29. Full validation suite

| Suite | Result |
|-------|--------|
| `npm run lint` | PASS (pre-existing unused-var / img warnings only) |
| `npm run typecheck` | PASS |
| `npm run test:enterprise-regression` | **394/394** PASS |
| `npm run test:legacy-billing-removal` | **16/16** PASS |
| `npm run test:technical-seo` | **43/43** PASS |
| `npm run test:mollie-billing` | **323/323** PASS |
| `node --test scripts/pricing-structured-data.test.mjs` | **6/6** PASS |
| `npm run build` | PASS |

Skipped failures: **0**

---

## 30. Live-charging safety

- `MOLLIE_LIVE_CHARGING_ENABLED` remains fail-closed in rollout module and `.env.example`
- This pass did **not** enable LIVE charging
- No redesign of working Mollie payment paths beyond dead-code removal and guard updates

---

## 31. Scope discipline

- No shipping / Merchant Product schema reintroduction
- No invented SEO certifications / reviews
- No unrelated refactors
- No push / deploy

---

## 32. Final forensic counts

| Provider | ACTIVE runtime/checkout | Historical exceptions (kept) | False positives / archive naming |
|----------|-------------------------|------------------------------|----------------------------------|
| FastSpring | **0** (lib deleted; 410 tombstones only) | Ownership detectors + DB enum + migrations + historical docs | Catalog aliases `mapFastSpringProductPath` (deprecated → catalog) |
| Stripe | **0** | Archive columns / webhook archive tables / types | Diagnostics field names (`stripe_*`) read-only |
| Paddle | **0** | Historical docs bannered SUPERSEDED; DB archive | Same |

**Historical exceptions (retained deliberately):** migrations, DB columns/types, historical ownership guards, superseded Build Bible / audit docs, 410 tombstone routes, redirect stub page.

---

## 33. SEO final counts

| Metric | Count |
|--------|-------|
| Public sitemap URLs | 98 |
| Defects fixed this pass | 4 |
| Critical SEO blockers remaining | 0 |
| `@type: Product` offer nodes | 0 |
| USD drift in pricing schema | 0 |
| Legacy providers as current public facts | 0 |

---

## 34. Local commit

- Message: `chore: finalize SEO integrity and eradicate legacy billing providers`
- SHA: use `git rev-parse HEAD` on this branch (single local commit; not pushed)
- Pushed: **NO**

---

## 35. Operator actions (necessary only)

1. After deploy: confirm `app` `/robots.txt` and `/sitemap.xml` redirect to www.
2. Remove any residual FastSpring / Stripe / Paddle secrets from Vercel Production env (names only — do not paste values into tickets).
3. Keep `MOLLIE_LIVE_CHARGING_ENABLED=false` until explicit LIVE go-live approval.
4. Optional: refresh GSC URL inspection for Security / Compliance / Integrations / incident solution titles.

---

## 36. Report metadata

| Field | Value |
|-------|-------|
| Report path | `docs/final-production-seo-legacy-billing-eradication.md` |
| Prior related report | `docs/legacy-billing-provider-removal-final.md` (superseded for ACTIVE runtime deletion status) |
| Mollie | sole active PSP |
| Auroranexis | commercial control plane / entitlements / invoicing |
