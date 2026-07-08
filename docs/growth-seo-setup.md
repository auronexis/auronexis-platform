# Growth & SEO Setup

This guide covers search engine setup, sitemap submission, and verification for Auroranexis public marketing surfaces.

## Canonical site

- Production canonical base: `https://auroranexis.com`
- Sitemap: `https://auroranexis.com/sitemap.xml`
- Robots: `https://auroranexis.com/robots.txt`

Authenticated routes (`/dashboard`, `/settings`, `/client-portal`, etc.) are disallowed in `robots.txt` and use `noindex` where applicable.

## Environment variables

### Search Console / Bing verification (optional)

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_BING_SITE_VERIFICATION=your-bing-verification-code
```

When set, verification meta tags are added to root metadata automatically.

### Analytics (optional — consent-gated)

```env
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=auroranexis.com
NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL=https://plausible.io/js/script.js
NEXT_PUBLIC_CLARITY_PROJECT_ID=your-clarity-project-id
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Scripts load only after the user grants the relevant consent category.

## Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add property `https://auroranexis.com`.
3. Choose **HTML tag** verification.
4. Copy the `content` value into `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
5. Deploy, then click **Verify** in Search Console.
6. Submit sitemap: `https://auroranexis.com/sitemap.xml`.

### Recommended first checks

- Inspect URL for `/`, `/pricing`, `/privacy`, `/solutions/customer-health-score`.
- Confirm canonical tags point to `https://auroranexis.com/...`.
- Review Coverage report for excluded auth routes (expected).
- Check mobile usability and Core Web Vitals.

## Bing Webmaster Tools

1. Open [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add site `https://auroranexis.com`.
3. Use meta tag verification with `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
4. Deploy and verify.
5. Submit the same sitemap URL.

## SEO architecture

- Metadata builder: `src/lib/seo/metadata.ts`
- Route registry: `src/lib/seo/routes.ts`
- Sitemap builder: `src/lib/seo/sitemap.ts`
- Robots builder: `src/lib/seo/robots.ts`
- JSON-LD helpers: `src/lib/seo/structured-data.ts`

Company data (name, description, canonical base) comes from `src/lib/company/`.

## Landing pages

High-intent solution pages live under `/solutions/*`. Template/resource pages live under `/templates/*`. Both are included in the sitemap.

## Notes

This document describes technical setup. It does not guarantee search rankings or legal compliance outcomes.
