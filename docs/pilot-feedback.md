# Pilot Feedback Process

**Version:** Auroranexis v0.96  
**Program:** Phase 5 pilot (3 customers, 6 weeks)

---

## Goals

Collect structured feedback to prioritize fixes and v1.0 features without expanding scope during the pilot.

---

## Cadence

| Week | Activity |
|------|----------|
| 0 | Kickoff — goals, success criteria, communication channel |
| 1–5 | Weekly 30-minute feedback call + async notes |
| 6 | Exit interview + renewal / GA discussion |

---

## Weekly feedback template

Send after each call or via shared doc:

1. **Overall satisfaction** (1–5)
2. **What worked well this week**
3. **Blockers or bugs** (severity: critical / high / medium / low)
4. **Missing capability** (must-have vs nice-to-have)
5. **Onboarding friction** (signup, billing, connectors, portal)
6. **Performance or reliability issues**
7. **One thing to improve next week**

---

## Severity definitions

| Level | Definition | Response SLA |
|-------|------------|--------------|
| Critical | Data loss, security issue, billing failure, total outage | Same day |
| High | Core workflow blocked, connector OAuth broken | 24 hours |
| Medium | Workaround exists, UX friction | 3 business days |
| Low | Cosmetic, documentation, future feature | Backlog |

---

## Tracking

- Log items in your issue tracker with label `pilot-feedback`
- Tag with pilot customer ID (no PII in titles)
- Link diagnostics screenshots when relevant (`/settings/diagnostics`)
- Review weekly in internal standup; assign owner and target week

---

## Exit survey (week 6)

1. Would you recommend Auroranexis to a peer agency? (NPS 0–10)
2. Top 3 features that delivered value
3. Top 3 gaps before you would pay full price
4. Pricing feedback (see [pricing-beta.md](./pricing-beta.md))
5. Permission to use anonymized quote for marketing (Y/N)

---

## Related

- [pilot-program.md](./pilot-program.md)
- [pilot-onboarding.md](./pilot-onboarding.md)
- [pricing-beta.md](./pricing-beta.md)
