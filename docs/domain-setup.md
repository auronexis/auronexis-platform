# Domain Setup

**Version:** Auroranexis v0.96  
**Domains:** `auroranexis.com`, `app.auroranexis.com`, `staging.auroranexis.com`

---

## DNS configuration

### Production marketing (`auroranexis.com`)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | 3600 |
| CNAME | `www` | `cname.vercel-dns.com` | 3600 |

Vercel project: marketing site (or redirect to app until landing ships).

**Recommended:** Redirect `www.auroranexis.com` → `auroranexis.com` in Vercel domain settings.

### Production application (`app.auroranexis.com`)

| Type | Name | Value |
|------|------|-------|
| CNAME | `app` | `cname.vercel-dns.com` |

Vercel project: `auroranexis-app`  
Environment: `NEXT_PUBLIC_APP_URL=https://app.auroranexis.com`

### Staging (`staging.auroranexis.com`)

| Type | Name | Value |
|------|------|-------|
| CNAME | `staging` | `cname.vercel-dns.com` |

Vercel project: `auroranexis-staging`  
Environment: `NEXT_PUBLIC_APP_URL=https://staging.auroranexis.com`

---

## SSL verification

Vercel provisions TLS automatically after DNS propagates.

Checklist:

- [ ] `https://auroranexis.com` — valid certificate
- [ ] `https://www.auroranexis.com` — redirect to apex or www (choose one canonical)
- [ ] `https://app.auroranexis.com` — valid certificate
- [ ] `https://staging.auroranexis.com` — valid certificate
- [ ] No mixed-content warnings in browser devtools

---

## Redirect rules

| From | To | Method |
|------|-----|--------|
| `http://*` | `https://*` | Vercel automatic |
| `www.auroranexis.com` | `auroranexis.com` | Vercel redirect |
| `/` on app domain (unauthenticated) | `/login` | App logic |
| Authenticated `/` | `/dashboard` | App logic |

---

## OAuth callback URLs

Register these redirect URIs in each OAuth provider console:

### Staging

```
https://staging.auroranexis.com/api/connectors/oauth/{connectorId}/callback
https://staging.auroranexis.com/auth/callback
```

### Production

```
https://app.auroranexis.com/api/connectors/oauth/{connectorId}/callback
https://app.auroranexis.com/auth/callback
```

Replace `{connectorId}` with: `google`, `microsoft`, `github`, `slack`, etc.

Supabase Auth redirect URLs (Supabase Dashboard → Authentication → URL Configuration):

| Environment | Site URL | Redirect URLs |
|-------------|----------|---------------|
| Staging | `https://staging.auroranexis.com` | `https://staging.auroranexis.com/auth/callback` |
| Production | `https://app.auroranexis.com` | `https://app.auroranexis.com/auth/callback` |

---

## Paddle webhook URLs

| Environment | Endpoint |
|-------------|----------|
| Staging | `https://staging.auroranexis.com/api/paddle/webhook` |
| Production | `https://www.auroranexis.com/api/paddle/webhook` (or app host matching DNS) |

> Historical Stripe webhook routes are removed. See [paddle-billing.md](./paddle-billing.md).

---

## Client portal (white label)

Portal routes use the same app domain:

- Staging: `https://staging.auroranexis.com/client-portal/login`
- Production: `https://app.auroranexis.com/client-portal/login`

Custom domains for white-label customers are configured per organization in Settings → Branding (future DNS CNAME per tenant).

---

## Verification commands

```bash
# DNS propagation
nslookup app.auroranexis.com
nslookup staging.auroranexis.com

# SSL
curl -I https://app.auroranexis.com
curl -I https://staging.auroranexis.com

# Health
curl https://staging.auroranexis.com/api/health
```

---

## Related

- [oauth-setup.md](./oauth-setup.md)
- [paddle-billing.md](./paddle-billing.md)
- [enterprise-deployment.md](./enterprise-deployment.md)
- [deployment-staging.md](./deployment-staging.md)
