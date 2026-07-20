> **ARCHIVED (Build Bible V2 Chapter 18).** Historical Phase 5 DNS notes. Authoritative production DNS and webhook guidance: [enterprise-deployment.md](./enterprise-deployment.md). Live billing webhook is `/api/paddle/webhook` — ignore Stripe webhook URLs below.

# DNS Report — Phase 5 Sprint 2

**Date:** 2025-06-23  
**Version:** Auroranexis v0.97  
**Status:** Documented — operator verification post-deploy

---

## Architecture

| Hostname | Purpose | DNS type | Target |
|----------|---------|----------|--------|
| `auroranexis.com` | Marketing | A or ALIAS | Vercel (`76.76.21.21`) |
| `www.auroranexis.com` | WWW redirect | CNAME | Vercel → redirect to apex |
| `app.auroranexis.com` | Production SaaS | CNAME | Staging project CNAME target |
| `staging.auroranexis.com` | Staging / pilot | CNAME | Staging project CNAME target |

Full procedure: [domain-setup.md](./domain-setup.md)

---

## Record templates

```
# Apex
auroranexis.com.     A      76.76.21.21

# Subdomains (use exact target from Vercel Domains UI)
app.                CNAME  cname.vercel-dns.com.
staging.            CNAME  cname.vercel-dns.com.
www.                CNAME  cname.vercel-dns.com.
```

---

## SSL certificates

| Host | Provider | Verification |
|------|----------|--------------|
| All | Vercel (Let's Encrypt) | Auto-provisioned after DNS propagates |

```bash
curl -I https://staging.auroranexis.com
# Expect: HTTP/2 200 or 307, valid cert
```

---

## Redirect rules

| From | To | Where |
|------|-----|-------|
| `http://*` | `https://*` | Vercel automatic |
| `www.auroranexis.com` | `auroranexis.com` | Vercel Domains → Redirect |
| Unauthenticated `/dashboard` | `/login` | App middleware |

---

## Cookie & session domains

| Setting | Staging | Production |
|---------|---------|------------|
| Supabase Auth cookie | Host-only (`staging.auroranexis.com`) | Host-only (`app.auroranexis.com`) |
| `NEXT_PUBLIC_APP_URL` | `https://staging.auroranexis.com` | `https://app.auroranexis.com` |

**Critical:** Do not share cookies across subdomains unless explicitly configured. Each app hostname is isolated.

---

## Callback domains

### Supabase Auth

```
https://staging.auroranexis.com/auth/callback
https://app.auroranexis.com/auth/callback
```

### OAuth connectors (per provider)

```
https://staging.auroranexis.com/api/connectors/oauth/{provider}/callback
https://app.auroranexis.com/api/connectors/oauth/{provider}/callback
```

Providers: Google, Microsoft, GitHub, Slack, Teams, Jira, Notion, HubSpot, GitLab, Salesforce, Zendesk, ClickUp, Linear

### Stripe webhooks

```
https://staging.auroranexis.com/api/stripe/webhook
https://app.auroranexis.com/api/stripe/webhook
```

---

## Verification checklist

- [ ] DNS propagated (`dig staging.auroranexis.com`)
- [ ] HTTPS valid on staging
- [ ] `www` redirects to apex (when marketing live)
- [ ] Login completes without redirect mismatch
- [ ] OAuth connector authorize → callback succeeds
- [ ] Stripe webhook delivers events

---

## Related

- [domain-report.md](./domain-report.md) (Sprint 1)
- [oauth-setup.md](./oauth-setup.md)
- [vercel-deployment.md](./vercel-deployment.md)
