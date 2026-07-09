# Final Launch QA

Customer-ready checklist for Auroranexis before activating analytics and acquiring real B2B customers.

Use with:
- `docs/launch-qa-checklist.md` (Phase 13)
- `docs/growth-seo-setup.md` (Phase 15)
- `docs/analytics-consent-checklist.md` (Phase 15)

## Phase 16 hardening summary

This phase focused on regression fixes — not new features:

- Table header hydration: `AuroraTableHead` now strips whitespace inside `<tr>` children
- Form actions: email settings and report email no longer throw `AuthorizationError` to the global boundary
- SLA default policy: errors return safely and show toast feedback
- Auth: `signIn` / `signUp` wrapped in try/catch; login/signup errors use `aria-live`
- Cookie consent: `aria-modal`, Escape key, safe-area padding, backdrop dismiss on modal
- Invalid HTML: replaced `Link` + `Button` nesting with `LinkButton` on key launch routes
- Breadcrumb JSON-LD: solution/template crumbs point to valid parent URLs

---

## Public website checklist

| Route | Check |
|-------|-------|
| `/` | Loads, consent banner, no console errors |
| `/about`, `/security`, `/status`, `/pricing` | Metadata + CTA work |
| `/solutions/*` (6 pages) | Content, FAQ, signup CTA |
| `/templates/*` (5 pages) | Checklist content, CTA |
| Legal pages (8) | Company card once, English labels |
| `/docs`, `/docs/api` | Metadata + canonical |

**Reject if:** placeholder copy, broken internal links, mixed German UI labels on English pages.

---

## Auth flow checklist

| Route | Check |
|-------|-------|
| `/login` | Invalid creds → inline error (not stack trace) |
| `/signup` | Validation errors inline |
| `/forgot-password` | Safe error copy |
| `/reset-password` | Invalid token handled |
| `/auth/callback` | Redirect works |

---

## App route checklist

| Area | Check |
|------|-------|
| `/dashboard` | Intelligence widgets, no hydration warnings |
| `/clients`, `/clients/[id]` | Empty states, row navigation |
| `/reports`, `/risks`, `/incidents` | Tables scroll on mobile |
| `/settings/plans` | Current plan, upgrade CTA |
| `/settings/billing` | Portal link, no raw Stripe errors |
| `/settings/sla` | Plan gate — no crash on Free plan |
| `/settings/usage` | Limits display |

---

## Billing / entitlements

- [ ] Checkout only for Owner/Admin
- [ ] Plan-gated features show upgrade panel — not 500
- [ ] `AuthorizationError` never reaches `error.tsx` from form actions
- [ ] Billing diagnostics admin-only
- [ ] No webhook secrets or `sk_live` in UI/logs

---

## Cookie consent

- [ ] Banner on first visit
- [ ] Reject / Accept / Manage all work
- [ ] Preferences persist in localStorage
- [ ] No analytics scripts before consent (verify Network tab)
- [ ] Missing env vars do not crash app
- [ ] Footer "Cookie preferences" reopens modal

---

## SEO / growth

- [ ] `https://auroranexis.com/sitemap.xml` — public routes only
- [ ] `https://auroranexis.com/robots.txt` — disallows app routes, references sitemap
- [ ] `/login`, `/signup` not in sitemap
- [ ] Canonical = `https://auroranexis.com`
- [ ] JSON-LD has no fake ratings/reviews

---

## Hydration / HTML validity

- [ ] No whitespace warnings in table headers
- [ ] No `button` inside `link` on primary CTAs
- [ ] No React hydration errors in browser console

---

## Mobile (360 / 768 / 1024 / 1366 / 1440)

- [ ] No horizontal overflow on marketing pages
- [ ] Tables use horizontal scroll
- [ ] Cookie banner buttons reachable
- [ ] Pricing cards stack correctly
- [ ] Client detail nav usable

---

## Accessibility

- [ ] Focus rings on interactive elements
- [ ] Auth errors announced (`aria-live`)
- [ ] Cookie dialog has `aria-modal`
- [ ] Icon buttons have labels where needed

---

## Security / logging

- [ ] No `console.log` in production paths
- [ ] No secrets in client bundle (`NEXT_PUBLIC_*` only for public config)
- [ ] User-facing errors are sanitized
- [ ] `error.tsx` shows generic copy only

---

## Validation commands

```bash
npm run lint
npm run typecheck
npm run build
```

All must pass before deploy.

---

## Owner tasks after launch

1. Set analytics env vars in Vercel when ready (Plausible first — see `docs/growth-seo-setup.md`)
2. Submit sitemap in Google Search Console and Bing Webmaster Tools
3. Run manual smoke test on production URLs from this checklist
4. Monitor Vercel logs for first 24h after customer onboarding
5. Legal review of cookie/privacy copy remains owner responsibility

---

## Known non-blocking issues

- Some secondary empty states still use `Link` + `Button` pattern (sales tables) — valid HTML fix deferred
- PostHog remains optional and consent-gated; subprocessors list may need PostHog entry when enabled
- Docs hub does not include all 17 doc slugs in sitemap (intentional subset)
- CSP in middleware differs slightly from `vercel.json` — analytics domains need CSP update when providers are enabled

---

## Analytics activation (post-launch)

Do **not** enable GA4 by default. Recommended order:

1. Plausible (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`)
2. Verify consent gating in production Network tab
3. Clarity optional (`NEXT_PUBLIC_CLARITY_PROJECT_ID`)
4. GA4 only if marketing conversion tracking is required (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)

See `docs/analytics-consent-checklist.md` for full QA steps.
