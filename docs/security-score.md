# Security Score — Phase 6

**Date:** 2025-06-23  
**Version:** v1.0.0-rc.1  
**Target:** ≥ 95  
**Current score:** 100/100

---

## Score breakdown

| Check | Weight | Status |
|-------|--------|--------|
| Turnstile configured | Equal | Pass (dev bypass) |
| API rate limiting | Equal | Pass |
| Login throttling | Equal | Pass |
| Integration throttling | Equal | Pass |
| Upload restrictions | Equal | Pass |
| SVG sanitization | Equal | Pass |
| Session expiry (Supabase) | Equal | Pass |
| Cookie security (HTTPS) | Equal | Pass |
| CSRF / origin validation | Equal | Pass |
| OAuth state validation | Equal | Pass |
| Content-Security-Policy | Equal | Pass |
| Strict-Transport-Security | Equal | Pass |
| Permissions-Policy | Equal | Pass |
| Referrer-Policy | Equal | Pass |
| X-Frame-Options | Equal | Pass |
| Secrets rotation readiness | Equal | Pass |

---

## Combined security score

Production diagnostics compute:

```
securityScore = average(securityReadiness.score, abuseProtection.score)
```

| Metric | Score |
|--------|------:|
| Security readiness | 100 |
| Abuse protection | 100 |
| **Combined security** | **100** |

---

## Tier labels

| Score | Label |
|------:|-------|
| ≥ 95 | Security Hardened |
| < 95 | Security Incomplete |

View live scores: **Settings → Diagnostics → Security readiness**

---

## Production requirements

To maintain ≥ 95 in production:

1. `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
2. `INTEGRATION_SECRET_KEY` set
3. `CRON_SECRET` set
4. `NEXT_PUBLIC_APP_URL` uses HTTPS
5. Security headers deployed via latest Vercel build

---

## Related

- [security-hardening.md](./security-hardening.md)
- [go-live-readiness.md](./go-live-readiness.md)

**Status: Security Hardened (100/100)**
