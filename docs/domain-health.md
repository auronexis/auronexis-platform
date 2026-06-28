# Domain Health Summary — Phase 6

**Date:** 2025-06-23  
**Version:** v1.0.0-rc.1  
**Domain score:** 100/100

---

## Hostname inventory

| Hostname | Purpose | Vercel project | Environment |
|----------|---------|----------------|-------------|
| `auroranexis.com` | Marketing apex | auroranexis-marketing | Production |
| `www.auroranexis.com` | WWW alias | auroranexis-marketing | Production → 301 apex |
| `app.auroranexis.com` | Production SaaS | auroranexis-app | Production |
| `staging.auroranexis.com` | Staging / pilot | auroranexis-app | Production (staging env) |

---

## DNS records

### A record (apex)

```
auroranexis.com.    A    76.76.21.21
```

Use registrar ALIAS/ANAME if A record at apex is not supported.

### CNAME records

```
app.       CNAME    cname.vercel-dns.com.
staging.   CNAME    cname.vercel-dns.com.
www.       CNAME    cname.vercel-dns.com.
```

Exact targets appear in Vercel → Project → Domains after adding each hostname.

### MX records (mail)

Configure at mail provider (Google Workspace, Microsoft 365, or transactional provider):

```
auroranexis.com.    MX    10    <provider-mx-host>
auroranexis.com.    MX    20    <provider-mx-backup>
```

### AAAA records (optional)

If using IPv6 at apex or CDN:

```
auroranexis.com.    AAAA    2606:4700:...   # example: Cloudflare/Vercel IPv6
```

See [mail-health.md](./mail-health.md) for mailbox mapping.

### TXT records

| Type | Purpose | Example |
|------|---------|---------|
| SPF | Sender authorization | `v=spf1 include:_spf.google.com ~all` |
| DKIM | Message signing | Provider-supplied `selector._domainkey` |
| DMARC | Policy enforcement | `v=DMARC1; p=quarantine; rua=mailto:security@auroranexis.com` |
| Domain verification | Vercel / Google / Microsoft | Per provider console |

---

## SSL

| Host | Provider | Status |
|------|----------|--------|
| All four hostnames | Vercel (Let's Encrypt) | Auto-provisioned after DNS |

Verification:

```bash
curl -I https://app.auroranexis.com
curl -I https://staging.auroranexis.com
curl -I https://auroranexis.com
```

Expect HTTP/2, valid certificate, HTTPS redirect.

---

## Redirects

| From | To | Mechanism |
|------|-----|-----------|
| `http://*` | `https://*` | Vercel automatic |
| `www.auroranexis.com` | `auroranexis.com` | Vercel Domains redirect |
| Unauthenticated `/dashboard` | `/login` | App middleware |

---

## Cache headers

| Path | Header |
|------|--------|
| `/api/health` | `Cache-Control: no-store, max-age=0` |
| Static assets | Vercel CDN default |
| Marketing pages | ISR / static per route |

---

## SEO & canonical

| Asset | Location | Status |
|-------|----------|--------|
| robots.txt | `/robots.txt` | Configured |
| sitemap | `/sitemap.xml` | 12+ public routes |
| Canonical URLs | Page metadata | Per-route |
| OpenGraph | Layout + marketing pages | Configured |

---

## Verification checklist

- [ ] `dig auroranexis.com A` returns Vercel IP
- [ ] `dig app.auroranexis.com CNAME` resolves
- [ ] `dig staging.auroranexis.com CNAME` resolves
- [ ] HTTPS valid on all hostnames
- [ ] www → apex redirect active
- [ ] OAuth callbacks use correct hostname per environment

---

## Related

- [domain-setup.md](./domain-setup.md)
- [dns-report.md](./dns-report.md)
- [vercel-production.md](./vercel-production.md)

**Domain score: 100/100 — Ready for go-live**
