# Landing Page Content Plan

**Version:** Auroranexis v0.96  
**Domain:** `auroranexis.com` (marketing)  
**App:** `app.auroranexis.com`

This document defines sections and messaging for the public marketing site. Implementation may be a separate Vercel project or static export.

---

## Navigation

- Product
- Pricing
- Security
- Docs / API
- Sign in → `https://app.auroranexis.com/login`
- Start free trial → `https://app.auroranexis.com/signup`

---

## Hero

**Headline:** Operational clarity for modern agencies  
**Subhead:** Reports, risks, incidents, automation, and client portals — one workspace for agency delivery teams.  
**CTA primary:** Start free trial  
**CTA secondary:** Book a demo (link to demo tenant walkthrough)  
**Visual:** Dashboard screenshot (demo workspace, anonymized data)

---

## Features

| Feature | Message |
|---------|---------|
| Client portfolio | Track health, revenue, and status across all clients |
| Reports | Templates, schedules, publish workflow, client portal delivery |
| Risks & incidents | Severity, ownership, resolution tracking |
| Automation | Rules and scheduled jobs without custom code |
| Diagnostics | Built-in health checks for billing, cron, queue, connectors |

---

## Pricing

Mirror [pricing-beta.md](./pricing-beta.md) list prices (not pilot discount).  
Highlight: 14-day trial, no credit card optional (product decision).  
Link to Stripe Checkout on app subdomain.

---

## Compliance

- GDPR tooling: access, export, deletion requests
- Audit events and retention policies
- SOC 2 readiness narrative (policies in-app, certification roadmap)
- Data residency: Supabase region disclosure

---

## API

- REST API overview → [api.md](./api.md)
- Authentication: API keys (future) / session for app
- Rate limits and webhooks (roadmap)

---

## Automation

- Report schedules
- Cron-backed jobs
- Queue workers for async tasks
- Link → [automation.md](./automation.md)

---

## AI

- Report drafting assistance (OpenAI-backed)
- Predictive health signals
- Clear disclosure: human review required before client delivery
- Link → [ai.md](./ai.md), [predictive.md](./predictive.md)

---

## Connectors

Supported integrations (OAuth):

Google, Microsoft, GitHub, Slack, Teams, Notion, HubSpot, Jira, GitLab, Zendesk, Linear, Salesforce, ClickUp

Link → [connectors.md](./connectors.md)

---

## White Label

- Custom domain for client portal (Enterprise)
- Logo and brand colors
- Link → [white-label.md](./white-label.md)

---

## Predictive

- Client health scores
- Risk trend signals
- Churn indicators (pilot)
- Link → [predictive.md](./predictive.md)

---

## Security

- Supabase Auth + RLS
- Encrypted connector tokens
- Stripe PCI scope minimized (Checkout / Portal)
- Link → [security.md](./security.md)

---

## Customer stories

Placeholder for pilot quotes post–week 6.  
Structure: agency size, use case, metric improved, quote.

---

## FAQ

**Who is Auroranexis for?**  
Agencies and MSPs managing multiple client accounts with recurring reporting and operational oversight.

**Where is data hosted?**  
Supabase (PostgreSQL) — region documented at signup.

**Can clients access reports?**  
Yes — client portal with role-based access.

**Do you support SSO?**  
Roadmap; email/password and magic link today.

**What about billing?**  
Stripe subscriptions, invoices, and customer portal.

---

## Roadmap

Public high-level (no dates committed in pilot):

- v1.0 GA — production hardening, expanded E2E, status page
- SSO / SAML
- Public API keys
- Additional connectors
- Mobile-optimized portal

---

## Footer

- Privacy policy
- Terms of service
- Contact / support email
- Status page link (when live)

---

## Related

- [domain-setup.md](./domain-setup.md)
- [deployment-staging.md](./deployment-staging.md)
- [06_BRAND_STANDARD_V1.md](./06_BRAND_STANDARD_V1.md)
