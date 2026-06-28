# Security Hardening — Phase 6

**Date:** 2025-06-23  
**Version:** v1.0.0-rc.1  
**Security score target:** ≥ 95

---

## Summary

| Control | Status | Implementation |
|---------|--------|----------------|
| Cloudflare Turnstile | Implemented | Login, signup, contact, support forms |
| Login throttling | Implemented | 10 attempts / 15 min per email |
| Signup throttling | Implemented | 5 attempts / hour per email |
| Public form throttling | Implemented | 8 submissions / 15 min per email |
| API rate limiting | Implemented | Per-plan limits with 429 responses |
| Integration rate limits | Implemented | Per-org, per-provider rolling window |
| Upload restrictions | Implemented | MIME + 2 MB + 4096px max |
| SVG sanitization | Implemented | Strip scripts, event handlers, foreignObject |
| CSRF validation | Implemented | Next.js Server Actions built-in CSRF protection |
| OAuth state validation | Implemented | 10-min TTL, single-use, org match |
| CSP headers | Implemented | `vercel.json` |
| HSTS | Implemented | 2-year max-age, includeSubDomains, preload |
| Permissions Policy | Implemented | camera, microphone, geolocation, payment disabled |
| Referrer Policy | Implemented | strict-origin-when-cross-origin |
| Frame protection | Implemented | X-Frame-Options: DENY |
| Health endpoint rate limit | Implemented | 120 req/min per IP, 429 on exceed |
| Secrets rotation | Documented | Manual rotate for `INTEGRATION_SECRET_KEY`, `CRON_SECRET` |

**Security score: 100/100** (diagnostics, development/staging with optional Turnstile bypass)

---

## Cloudflare Turnstile

Protected surfaces:

| Surface | Route / action |
|---------|----------------|
| Login | `/login` → `signIn` |
| Signup | `/signup` → `signUp` |
| Contact | `/contact` → `submitContactForm` |
| Support | `/support` → `submitContactForm` |

Environment variables:

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

**Production:** Both keys required. Without them, auth and public forms reject submissions in production.

**Development:** Bypassed when `TURNSTILE_SECRET_KEY` is unset.

**E2E (Playwright):** `TURNSTILE_DISABLE=1` and `E2E_DISABLE_RATE_LIMIT=1` are injected via `playwright.config.ts` webServer env. Runtime checks use bracket access (`process.env["TURNSTILE_DISABLE"]`) in `src/lib/security/e2e-bypass.ts` so Next.js does not inline bypass flags at build time. Auth uses one-time login + `storageState` (`e2e/auth.setup.ts`); logout runs last in `e2e/z-logout.spec.ts` so Supabase session invalidation does not break subsequent suites.

CSP updated in `vercel.json` to allow `challenges.cloudflare.com`.

---

## Rate limiting & throttling

| Layer | Limit | Response |
|-------|-------|----------|
| Login | 10 / 15 min / email | Generic error + retry seconds |
| Signup | 5 / hour / email | Generic error |
| Contact/support | 8 / 15 min / email | Generic error |
| Public API | 30–300 / min by plan | HTTP 429 + `X-RateLimit-*` |
| Health probe | 120 / min / IP | HTTP 429 + `Retry-After` |
| Integrations | Per-provider | `rate_limited` delivery status |

Code: `src/lib/security/rate-limit.ts`, `src/lib/security/login-throttle.ts`

---

## Upload security

White-label assets (`white-label-assets` bucket):

- Private bucket (not public)
- Allowed MIME: PNG, JPEG, WEBP, SVG, ICO
- Max size: 2 MB
- Max dimensions: 4096px
- SVG sanitized before storage (`src/lib/security/svg-sanitize.ts`)

---

## HTTP security headers

Configured in `vercel.json` for all routes. See [production-security.md](./production-security.md).

---

## Session & cookies

- Supabase Auth HTTP-only cookies via `@supabase/ssr`
- Host-only cookies per subdomain (staging vs app isolated)
- Session refresh handled by Supabase JWT refresh flow

---

## Operator checklist

- [ ] Set Turnstile keys in Vercel production
- [ ] Verify CSP does not block Turnstile widget
- [ ] Confirm login throttle messages appear after repeated failures
- [ ] Test SVG upload rejection for malicious content
- [ ] Rotate `CRON_SECRET` and `INTEGRATION_SECRET_KEY` before go-live if reused from staging

---

## Related

- [security-score.md](./security-score.md)
- [abuse-protection.md](./abuse-protection.md)
- [production-security.md](./production-security.md)
