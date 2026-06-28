# Domain Report — Phase 5 Sprint 1

**Date:** 2025-06-23  
**Version:** Auroranexis v0.96

---

## Target configuration

| Hostname | Purpose | Target |
|----------|---------|--------|
| `auroranexis.com` | Marketing landing | Vercel (marketing project or redirect) |
| `www.auroranexis.com` | WWW alias | 301 → `auroranexis.com` |
| `app.auroranexis.com` | Production SaaS | Vercel production project |
| `staging.auroranexis.com` | Staging / pilot | Vercel staging project |

Full DNS records: [domain-setup.md](./domain-setup.md)

---

## DNS requirements

### Apex (`auroranexis.com`)

- **A record** → Vercel anycast IP (`76.76.21.21`) **or**
- **ALIAS/ANAME** at registrar if supported

### Subdomains

| Record | Name | Value |
|--------|------|-------|
| CNAME | `app` | `cname.vercel-dns.com` |
| CNAME | `staging` | `cname.vercel-dns.com` |
| CNAME | `www` | `cname.vercel-dns.com` |

Exact CNAME targets appear in Vercel → Domains after adding each hostname.

---

## SSL verification

| Host | Expected |
|------|----------|
| All hosts | Valid Let's Encrypt cert via Vercel |
| HTTPS only | Vercel enforces HTTPS |
| HSTS | Enabled on production app (Vercel default) |

**Checklist:**

- [ ] `https://staging.auroranexis.com` — valid cert, no mixed content
- [ ] `https://app.auroranexis.com` — valid cert (before GA)
- [ ] `https://auroranexis.com` — valid cert when marketing site live

---

## Redirect verification

| From | To | Status |
|------|-----|--------|
| `http://*` | `https://*` | Vercel automatic |
| `www.auroranexis.com` | `auroranexis.com` | Configure in Vercel Domains |
| `/` on app subdomain | Dashboard or login | App routing |

---

## OAuth callback URLs

Each provider must allow these redirect URIs (staging example):

```
https://staging.auroranexis.com/api/connectors/oauth/{provider}/callback
```

Production:

```
https://app.auroranexis.com/api/connectors/oauth/{provider}/callback
```

Supabase Auth redirect:

```
https://staging.auroranexis.com/auth/callback
https://app.auroranexis.com/auth/callback
```

Details: [oauth-setup.md](./oauth-setup.md)

---

## Stripe webhook URLs

| Environment | URL |
|-------------|-----|
| Staging | `https://staging.auroranexis.com/api/stripe/webhook` |
| Production | `https://app.auroranexis.com/api/stripe/webhook` |

---

## Environment URL alignment

`NEXT_PUBLIC_APP_URL` must match the deployed hostname exactly (no trailing slash):

| Project | Value |
|---------|-------|
| Staging | `https://staging.auroranexis.com` |
| Production | `https://app.auroranexis.com` |

Mismatch causes OAuth and email link failures.

---

## Verification commands

```bash
curl -I https://staging.auroranexis.com
curl -I https://staging.auroranexis.com/api/health
curl -I https://www.auroranexis.com
```

---

## Status

| Item | Local docs | Live DNS |
|------|------------|----------|
| DNS documentation | ✅ Complete | ⏳ Operator action |
| SSL procedure | ✅ Documented | ⏳ Verify post-deploy |
| Callback URL matrix | ✅ Complete | ⏳ Register in each provider |
| Redirect rules | ✅ Documented | ⏳ Configure in Vercel |

---

## Related

- [domain-setup.md](./domain-setup.md)
- [vercel-checklist.md](./vercel-checklist.md)
- [deployment-report.md](./deployment-report.md)
