# Pilot Onboarding Guide

**Version:** Auroranexis v0.96  
**Audience:** Pilot customer champions and Auroranexis team

---

## Pre-onboarding (Auroranexis team)

- [ ] Staging environment healthy (`/api/health`)
- [ ] Pilot org created or customer signs up on staging
- [ ] Plan set to Professional or Business (or Enterprise via `DEV_FORCE_PLAN` during pilot)
- [ ] Stripe test checkout verified
- [ ] Support channel created (Slack Connect or email alias)
- [ ] Kickoff call scheduled

---

## Day 1 — Account setup

**Customer actions:**

1. Receive invite or sign up at staging URL
2. Complete organization profile (Settings → Organization)
3. Invite team members (Settings → Team)
4. Review plan features (Settings → Diagnostics → Plan resolution)

**Auroranexis actions:**

1. Walk through dashboard tour (30 min)
2. Verify Diagnostics all green
3. Share [pilot-feedback.md](./pilot-feedback.md) template

---

## Week 1 — Core data

| Task | Module |
|------|--------|
| Import first 3 clients | Clients |
| Create first report | Reports |
| Configure email settings | Settings → Email |
| Set up SLA policy (optional) | Settings → SLA |

**Checkpoint:** 3 clients, 1 report draft complete.

---

## Week 2 — Delivery workflow

| Task | Module |
|------|--------|
| Create report template | Reports → Templates |
| Schedule recurring report | Reports → Schedules |
| Publish and export PDF | Reports |
| Send report email (if plan allows) | Report detail |

**Checkpoint:** 1 published report delivered to internal recipient.

---

## Week 3 — Operations

| Task | Module |
|------|--------|
| Log risks for a client | Risks |
| Create and resolve incident | Incidents |
| Review activity feed | Activity |

---

## Week 4 — Automation & integrations

| Task | Module |
|------|--------|
| Connect one OAuth provider | Automation → Connectors |
| Create simple automation workflow | Automation |
| Review integration delivery logs | Automation → Integrations |

---

## Week 5 — Governance

| Task | Module |
|------|--------|
| Explore compliance center | Dashboard → Compliance |
| Run audit export | Compliance → Audit Explorer |
| API keys (if applicable) | Settings → API |

---

## Week 6 — Retrospective

1. Complete [pilot-feedback.md](./pilot-feedback.md) survey
2. Production migration planning call
3. Case study interview (optional)
4. Transition to production billing (live Stripe)

---

## Support SLAs (pilot)

| Severity | Response | Resolution target |
|----------|----------|-------------------|
| P0 — Down | 2 hours | 24 hours |
| P1 — Major feature broken | 4 hours | 48 hours |
| P2 — Minor issue | 1 business day | Next sprint |
| P3 — Enhancement | Tracked | Roadmap |

---

## Related

- [pilot-program.md](./pilot-program.md)
- [demo-tenant.md](./demo-tenant.md)
