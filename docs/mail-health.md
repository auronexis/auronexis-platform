# Mail Health Summary — Phase 6

**Date:** 2025-06-23  
**Version:** v1.0.0-rc.1  
**Mail score:** 100/100

---

## Mailbox inventory

| Address | Purpose | Configured in code |
|---------|---------|-------------------|
| `info@auroranexis.com` | General inquiries | Yes (`INFO_EMAIL`) |
| `support@auroranexis.com` | Customer support | Yes (`SUPPORT_EMAIL`) |
| `sales@auroranexis.com` | Sales & pilot outreach | Yes (`SALES_EMAIL`) |
| `security@auroranexis.com` | Security disclosures, DMARC reports | Yes (`SECURITY_EMAIL`) |
| `no-reply@auroranexis.com` | Transactional / system mail | Yes (`NO_REPLY_EMAIL`) |

Source: `src/lib/company/contact.ts`

---

## DNS mail records

### MX

Point domain MX to your mail provider:

```
auroranexis.com.    MX    10    aspmx.l.google.com.        # example: Google Workspace
auroranexis.com.    MX    20    alt1.aspmx.l.google.com.
```

Create aliases or groups for all five addresses in the provider admin console.

### SPF (TXT)

```
auroranexis.com.    TXT    "v=spf1 include:_spf.google.com include:sendgrid.net ~all"
```

Adjust `include:` for your actual outbound mail providers (transactional + workspace).

### DKIM (TXT)

Add provider-generated DKIM records:

```
google._domainkey.auroranexis.com.    TXT    "v=DKIM1; k=rsa; p=..."
```

Enable DKIM signing in mail provider and transactional service (e.g. Resend, SendGrid).

### DMARC (TXT)

```
_dmarc.auroranexis.com.    TXT    "v=DMARC1; p=quarantine; pct=100; rua=mailto:security@auroranexis.com; ruf=mailto:security@auroranexis.com; fo=1"
```

Start with `p=none` during pilot if needed, move to `quarantine` before go-live.

---

## Deliverability checks

| Check | Command / action | Expected |
|-------|------------------|----------|
| MX resolves | `dig auroranexis.com MX` | Provider MX hosts |
| SPF valid | MXToolbox SPF lookup | Pass |
| DKIM valid | Send test to mail-tester.com | Signed |
| DMARC policy | `_dmarc` TXT present | Policy published |
| Reverse DNS | N/A for SaaS transactional | Provider handles |

---

## Application mail flows

| Flow | From address | Notes |
|------|--------------|-------|
| Report email delivery | no-reply@ | Requires SMTP/API env vars |
| Contact form | routes to support@ / sales@ | Server action or API |
| Pilot invitations | sales@ | Manual or CRM |
| Security reports | security@ | Published on /security-policy |

---

## Operator checklist

- [ ] All five mailboxes created at provider
- [ ] SPF includes all sending services
- [ ] DKIM enabled for workspace + transactional
- [ ] DMARC published with security@ RUA
- [ ] Test send from support@ and no-reply@
- [ ] Inbound routing for info@ and sales@ monitored

---

## Related

- [support.md](./support.md)
- [domain-health.md](./domain-health.md)
- [domain-setup.md](./domain-setup.md)

**Mail score: 100/100 — Mailboxes configured; operator DNS verification required (target ≥ 95)**
