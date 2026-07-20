# Analytics & Consent QA Checklist

Use this checklist after deploying analytics / growth infrastructure.

## Environment

- [ ] `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` set (if using Plausible)
- [ ] `NEXT_PUBLIC_CLARITY_PROJECT_ID` set (if using Clarity)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` set only when marketing tracking is required
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` set only when product analytics is required
- [ ] `NEXT_PUBLIC_GTM_CONTAINER_ID` reserved for future GTM (optional stub)
- [ ] `NEXT_PUBLIC_BING_SITE_VERIFICATION` for Bing Webmaster (SEO metadata)
- [ ] No private secrets in `NEXT_PUBLIC_*` variables

## Cookie consent banner

- [ ] Banner appears on first visit to `/`
- [ ] **Reject non-essential** keeps analytics scripts unloaded
- [ ] **Accept all** allows configured analytics scripts to load
- [ ] **Manage** opens preferences modal with Essential / Analytics / Marketing toggles
- [ ] Preferences persist after reload
- [ ] Footer **Cookie preferences** link reopens modal
- [ ] Links to `/cookies` and `/privacy` work

## Script loading order

- [ ] No Clarity script before analytics consent
- [ ] No GA4 script before marketing consent
- [ ] No PostHog init before analytics consent
- [ ] Plausible loads only after analytics consent (when configured)
- [ ] Analytics-only consent never loads GA4
- [ ] Marketing-only consent does not load Plausible/Clarity/PostHog
- [ ] No console errors when env vars are unset

## Conversion events (with consent granted)

- [ ] `page_view` on route changes (tagged `surface`: public / app / portal)
- [ ] `pricing_view` on `/pricing`
- [ ] `features_page_viewed` on `/features`
- [ ] `legal_page_viewed` on `/privacy`, `/terms`, `/cookies`
- [ ] `portal_login` queued from portal login form
- [ ] Events do not include email addresses, org IDs, or client names

## Legal pages

- [ ] `/cookies` describes Plausible, Clarity, PostHog, GA4 with conditional wording
- [ ] `/privacy` includes analytics and consent section
- [ ] Wording uses "where enabled" / "if consent is granted" — not claiming tools are always active

## SEO

- [ ] `/sitemap.xml` includes solutions, templates, legal, docs
- [ ] `/robots.txt` disallows private app routes
- [ ] Auth pages have `noindex` metadata
- [ ] Google Search Console / Bing Webmaster verification configured by owner

## Performance

- [ ] Public pages load without layout shift from consent banner
- [ ] Analytics scripts use `defer` / async injection
- [ ] No blocking third-party scripts before consent

## Owner reminders

- Submit sitemap in Google Search Console and Bing Webmaster Tools
- Configure Plausible/Clarity dashboards after DNS/deploy
- Wire `trackBillingLifecycleEvent` from Paddle webhooks only in Release chapters
- Review consent rates periodically
- Legal review of cookie/privacy copy remains the owner's responsibility
