# Pilot Execution — v0.995

**Date:** 2025-06-23  
**Version:** Auroranexis v0.995.0  
**Status:** Pilot Execution Ready  
**Prior status:** Production Deployment Ready (v0.99)

---

## Objective

Transform Auroranexis from **Production Deployment Ready** into **Pilot Execution Ready** — a fully simulated pilot environment with demo data, RBAC accounts, customer journey validation, and commercial assets.

No major new features. No architectural changes.

---

## Sprint 5 deliverables

| Part | Deliverable | Location |
|------|-------------|----------|
| 1 | Demo workspace hardening | `seed_demo_hardening.sql` |
| 2 | Persona organizations (×5) | `seed_persona_workspaces.sql`, `seed-pilot-environment.mjs` |
| 3 | Pilot RBAC accounts (×4) | `scripts/seed-pilot-environment.mjs` |
| 4 | Customer journey map | [customer-journey.md](./customer-journey.md) |
| 5 | E2E suite (30 tests) | [e2e-final.md](./e2e-final.md) |
| 6 | Staging validation | [demo-environment.md](./demo-environment.md) |
| 7 | Pilot program assets | [pilot-assets/](./pilot-assets/) |
| 8 | v1.0 RC readiness | [v1-rc-readiness.md](./v1-rc-readiness.md) |

---

## Bootstrap sequence

```bash
# 1. Create orgs + pilot accounts (Supabase service role required)
npm run seed:pilot

# 2. SQL seeds (Supabase SQL Editor, in order)
#    supabase/scripts/seed_demo_workspace.sql
#    supabase/scripts/seed_demo_hardening.sql
#    supabase/scripts/seed_persona_workspaces.sql

# 3. Configure E2E credentials in .env.local
E2E_EMAIL=demo@auroranexis.com
E2E_PASSWORD=<PILOT_SEED_PASSWORD>

# 4. Validate
npm run lint && npm run typecheck && npm run build && npm run test:e2e
```

---

## Pilot accounts (aurora-demo org)

| Email | Role | Purpose |
|-------|------|---------|
| `demo@auroranexis.com` | Owner | Primary demo + E2E |
| `pilot-owner@auroranexis.com` | Admin | RBAC admin validation |
| `pilot-operator@auroranexis.com` | Staff | Operator workflows |
| `pilot-viewer@auroranexis.com` | Viewer | Read-only validation |

Default seed password: set via `PILOT_SEED_PASSWORD` (see `.env.example`). **Never commit passwords.**

---

## Persona organizations

| Organization | Slug | Segment |
|--------------|------|---------|
| Acme Automation | `acme-automation` | Automation firm |
| Vertex MSP | `vertex-msp` | MSP |
| Bluewave Consulting | `bluewave-consulting` | Consultancy |
| NovaOps | `novaops` | Operations agency |
| CyberFlow | `cyberflow` | Security MSP |

Acme Automation also appears as flagship client inside `aurora-demo`.

---

## Readiness scores (target ≥ 98)

| Dimension | Target |
|-----------|--------|
| Deployment readiness | 100 |
| Website readiness | ≥ 95 |
| Legal readiness | ≥ 95 |
| Support readiness | ≥ 95 |
| Pilot program readiness | ≥ 95 |
| Pilot execution readiness | ≥ 98 |
| **Overall production readiness** | **≥ 98 — Pilot Execution Ready** |

View live scores: Settings → Diagnostics.

---

## Staging sign-off

- [ ] `https://staging.auroranexis.com/api/health` returns healthy/degraded JSON
- [ ] Demo workspace login (`demo@auroranexis.com`)
- [ ] RBAC verified for all 4 pilot accounts
- [ ] E2E 30/30 PASS on staging
- [ ] First pilot invitation sent

---

## Related

- [demo-environment.md](./demo-environment.md)
- [pilot-checklist-v1.md](./pilot-checklist-v1.md)
- [v1-rc-readiness.md](./v1-rc-readiness.md)
