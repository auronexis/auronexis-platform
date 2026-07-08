# Analytics & Consent QA Checklist

Use this checklist after deploying Phase 15 growth infrastructure.

## Environment

- [ ] `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` set (if using Plausible)
- [ ] `NEXT_PUBLIC_CLAUSIBLE_PROJECT_ID` set (if using Clarity)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` set only when marketing tracking is required
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` set only when product analytics is required
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
- [ ] No console errors when env vars are unset

## Conversion events (with consent granted)

- [ ] `page_view` on route changes
- [ ] `pricing_viewed` on `/pricing`
- [ ] `legal_page_viewed` on `/privacy`, `/terms`, `/cookies`
- [ ] Events do not include email addresses or client names

## Legal pages

- [ ] `/cookies` describes Plausible, Clarity, PostHog, GA4 with conditional wording
- [ ] `/privacy` includes analytics and consent section
- [ ] Wording uses "where enabled" / "if consent is granted" — not claiming tools are always active

## SEO

- [ ] `/sitemap.xml` includes solutions, templates, legal, docs
- [ ] `/robots.txt` disallows `/dashboard`, `/settings`, `/client-portal`, `/api/`
- [ ] `/login` and `/signup` are **not** in sitemap
- [ ] Auth pages have `noindex` metadata
- [ ] Home page JSON-LD validates (Organization, WebSite, SoftwareApplication, FAQ)

## Performance

- [ ] Public pages load without layout shift from consent banner
- [ ] Analytics scripts use `defer` / async injection
- [ ] No blocking third-party scripts before consent

## Owner reminders

- Submit sitemap in Google Search Console and Bing Webmaster Tools
- Configure Plausible/Clarity dashboards after DNS/deploy
- Review consent rates periodically
- Legal review of cookie/privacy copy remains the owner's responsibility
