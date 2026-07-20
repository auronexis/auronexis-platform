> **ARCHIVED (Build Bible V2 Chapter 14).** Use [enterprise-deployment.md](./enterprise-deployment.md), [enterprise-release-checklist.md](./enterprise-release-checklist.md), and [rollback-plan.md](./rollback-plan.md). Historical Stripe-era notes below are not authoritative.
# Production Hardening â€” Phase 17

Enterprise production readiness for Auroranexis: PWA manifest, metadata, security headers, email abstraction, and environment audit.

## Manifest syntax error â€” root cause

Chrome reported `Manifest: Syntax error â€” Line 1 Column 1` even though `/manifest.webmanifest` returned valid JSON when fetched directly.

**Root cause:** Next.js middleware intercepted `/manifest.webmanifest` for unauthenticated requests. Supabase session middleware redirected to `/login`, returning **HTML** instead of JSON. Chrome attempted to parse the login page HTML as a web manifest.

**Fix:**
- Exclude `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, and `favicon.svg` from auth middleware
- Add static asset paths to `shouldBypassSessionMiddleware()` and `isPublicPath()`
- Update middleware matcher to skip these routes

## Metadata single source of truth

| Concern | Source |
|---------|--------|
| Icons | `src/lib/branding/icons.ts` |
| Platform metadata | `src/lib/branding/metadata.ts` |
| Page metadata | `src/lib/seo/metadata.ts` â†’ `createPageMetadata()` |
| Manifest | `src/app/manifest.ts` (uses `PLATFORM_MANIFEST_ICONS`) |
| Company SEO | `src/lib/company/company-seo.ts` |

## Security headers

| Header | Source |
|--------|--------|
| CSP | `src/lib/security/csp.ts` |
| All production headers | `src/lib/security/headers.ts` |
| Middleware | `src/lib/security/response-headers.ts` |
| Next.js config | `next.config.ts` |
| Vercel edge (static assets) | `vercel.json` |

CSP allows: Supabase, Stripe, PostHog, Plausible, Clarity, GA4, Cloudflare Turnstile, Sentry.

## Email provider abstraction

Transactional email is provider-agnostic:

```
src/lib/email/
  addresses.ts          â€” platform sender addresses
  types.ts              â€” EmailMessage, EmailSendResult
  provider/
    index.ts            â€” sendEmail() entry point
    resend.ts           â€” default provider
    postmark.ts         â€” HTTP API
    mailgun.ts          â€” HTTP API
    ses.ts              â€” documented; use SMTP relay
    smtp.ts             â€” HTTPS relay bridge
```

### Environment variables

| Variable | Purpose |
|----------|---------|
| `EMAIL_PROVIDER` | `resend` (default), `postmark`, `mailgun`, `ses`, `smtp` |
| `EMAIL_FROM` | Platform default sender (overrides `RESEND_FROM_EMAIL`) |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Legacy Resend sender |
| `POSTMARK_SERVER_TOKEN` | Postmark server token |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` | Mailgun credentials |
| `AWS_SES_*` | SES region and credentials |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | SMTP relay |
| `SMTP_RELAY_URL` | HTTPS bridge for SMTP provider |

### Platform sender addresses

| Address | Use |
|---------|-----|
| `no-reply@auroranexis.com` | Transactional (reports, auth) |
| `support@auroranexis.com` | Support replies |
| `legal@auroranexis.com` | Legal notices |

Defined in `src/lib/company/company-contact.ts`.

## Supabase Auth email branding

Password reset and signup emails are sent by **Supabase Auth**, not the application email provider.

### Production configuration

1. **Supabase Dashboard â†’ Project Settings â†’ Auth â†’ SMTP Settings**
   - Enable custom SMTP (Resend SMTP, Postmark SMTP, or AWS SES SMTP)
   - Sender: `Auroranexis <no-reply@auroranexis.com>`
   - Reply-to: `support@auroranexis.com`

2. **Authentication â†’ Email Templates**
   - Update Reset Password, Confirm Signup, Magic Link templates
   - Remove Supabase branding
   - Use Auroranexis product name and support contact

3. **DNS**
   - SPF, DKIM, DMARC for `auroranexis.com`
   - Verify domain in Resend/Postmark before switching Supabase SMTP

See `docs/auth/password-reset.md` for full flow and template copy.

## Production environment audit

`src/lib/env/production-audit.ts` â€” non-throwing audit for:
- Supabase, Stripe (required)
- Email provider (recommended)
- Plausible, Clarity, Search Console verification (optional)

## Owner checklist after Phase 17

- [ ] Verify Chrome DevTools â†’ Application â†’ Manifest shows no syntax errors
- [ ] Confirm `/manifest.webmanifest` returns JSON without auth redirect
- [ ] Configure Supabase custom SMTP with `no-reply@auroranexis.com`
- [ ] Set `EMAIL_FROM=Auroranexis <no-reply@auroranexis.com>` in Vercel production
- [ ] Verify SPF/DKIM/DMARC for `auroranexis.com`
- [ ] Smoke test report email delivery after Resend domain verification
- [ ] Confirm Stripe checkout still works (CSP frame-src includes `js.stripe.com`)

## CSP sync note

`vercel.json` CSP must stay aligned with `src/lib/security/csp.ts` for static assets that bypass Next.js middleware. When adding analytics domains, update both locations.

