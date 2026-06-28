# Customer Journey — Pilot Simulation

**Version:** v0.995.0  
**Purpose:** End-to-end lifecycle validation before first founding customer

---

## Journey map

```
Signup → Workspace → Client → Risk → Incident → Report → Compliance → Billing → Portal → Automation → Diagnostics
```

---

## Step-by-step validation

| # | Step | Route | Actor | Expected |
|---|------|-------|-------|----------|
| 1 | Signup | `/signup` | New user | Org + owner created |
| 2 | Workspace | `/dashboard` | Owner | Command center loads |
| 3 | Client creation | `/clients/new` | Owner/Admin | Client appears in list |
| 4 | Risk creation | `/risks/new` | Staff+ | Risk linked to client |
| 5 | Incident creation | `/incidents/new` | Staff+ | Incident timeline |
| 6 | Report generation | `/reports/new` | Staff+ | Draft → ready workflow |
| 7 | Report publish | Report detail | Admin+ | Status → published |
| 8 | Compliance export | `/dashboard/compliance/audit` | Owner/Admin | Export CSV/JSON |
| 9 | Billing upgrade | `/settings/billing` | Owner | Stripe Checkout (test) |
| 10 | Portal invite | Client detail | Admin+ | Portal user created |
| 11 | Portal login | `/client-portal/login` | Portal user | Scoped client view |
| 12 | Automation | `/automation` | Plan-gated | Workflow list + run |
| 13 | Diagnostics | `/settings/diagnostics` | Owner/Admin | All sections visible |
| 14 | Queue events | Diagnostics → Queue | Owner/Admin | Job counts > 0 (after seed) |
| 15 | Cron execution | Diagnostics → Cron | Owner/Admin | Recent executions |
| 16 | Audit trail | `/dashboard/compliance/audit` | Owner/Admin | Events listed |

---

## RBAC validation matrix

| Action | Owner | Admin | Staff | Viewer |
|--------|-------|-------|-------|--------|
| Create client | ✅ | ✅ | ✅ | ❌ |
| Create report | ✅ | ✅ | ✅ | ❌ |
| View diagnostics | ✅ | ✅ | ❌ | ❌ |
| Billing upgrade | ✅ | ✅ | ❌ | ❌ |
| Compliance export | ✅ | ✅ | ❌ | ❌ |
| View dashboard | ✅ | ✅ | ✅ | ✅ |

Test with pilot accounts — see [pilot-execution.md](./pilot-execution.md).

---

## UX quality gates

- [ ] No horizontal overflow at 375px on dashboard
- [ ] Loading states on AI panels (when key present)
- [ ] Error messages are actionable (billing, auth)
- [ ] Skip link reaches `#main-content`
- [ ] Breadcrumbs accurate on settings pages
- [ ] Empty states guide next action (new org without seed)

---

## Automated coverage

| Journey step | E2E spec |
|--------------|----------|
| Login | `flows.spec.ts` |
| Create client/risk/incident/report | `flows.spec.ts` |
| Module smoke | `staging.spec.ts` |
| Health API | `smoke.spec.ts` |

Manual only: Stripe checkout, OAuth connect, portal invite acceptance.

---

## Related

- [demo-script-v2.md](./demo-script-v2.md)
- [e2e-final.md](./e2e-final.md)
- [functional-qa-audit.md](./functional-qa-audit.md)
