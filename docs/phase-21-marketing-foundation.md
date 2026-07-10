# Phase 21 — Enterprise Marketing Foundation

Production growth infrastructure for Auroranexis public marketing surfaces.

## Architecture

| Layer | Location |
|-------|----------|
| SEO metadata | `src/lib/seo/metadata.ts`, `src/lib/branding/metadata.ts` |
| Structured data | `src/lib/company/company-schema.ts`, `src/lib/seo/structured-data.ts` |
| Sitemap / robots | `src/app/sitemap.ts`, `src/app/robots.ts` |
| CTA system | `src/lib/marketing/cta.ts`, `src/components/marketing/marketing-button.tsx` |
| Content pacing | `src/components/marketing/marketing-pace.tsx` |
| Motion | `src/lib/ui/marketing-motion.ts` |
| Analytics | `src/lib/analytics/*`, `src/components/analytics/*` |
| Consent gate | `src/lib/analytics/consent-gate.ts` |

## Environment variables (production)

| Variable | Provider |
|----------|----------|
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible |
| `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL` | Plausible script (optional) |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Microsoft Clarity |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog (optional) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 marketing (optional) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster |

Analytics load **only in production** and **only after consent**.

## Analytics events

- `page_view` — route changes (PageViewTracker)
- `pricing_viewed` — pricing page
- `enterprise_page_viewed` — `/enterprise`
- `cta_clicked` — MarketingButton interactions
- `demo_requested` — demo booking form success
- `signup_started`, `signup_completed`, `login_completed`
- `contact_clicked`, `support_clicked`
- `checkout_started`, `checkout_completed`, `plan_selected`
- `client_created`, `report_created`, `risk_created`, `incident_created`
- `docs_viewed`, `legal_page_viewed`, `portal_viewed`

Clarity receives mirrored custom events via `claritySink`.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```

Manual checks:

- [ ] `/sitemap.xml` lists public routes including `/enterprise`
- [ ] `/robots.txt` disallows dashboard/auth/api
- [ ] OG/Twitter preview on home, enterprise, pricing
- [ ] JSON-LD validates in Rich Results Test
- [ ] No analytics scripts in development
- [ ] CTA clicks fire after analytics consent
- [ ] `prefers-reduced-motion` respected
