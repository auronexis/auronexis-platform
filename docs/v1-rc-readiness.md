# v1.0 RC Readiness — v0.995

**Date:** 2025-06-23  
**Version:** Auroranexis v0.995.0  
**Status:** Pilot Execution Ready  
**Next milestone:** v1.0.0 GA

---

## Readiness dimensions

| Dimension | Source | Target | Notes |
|-----------|--------|--------|-------|
| Deployment readiness | `deployment-readiness.ts` | 100 | Vercel, cron, health, SEO |
| Website readiness | `pilot-acquisition.ts` | ≥ 95 | Marketing site complete |
| Legal readiness | `pilot-acquisition.ts` | ≥ 95 | All legal routes |
| Support readiness | `pilot-acquisition.ts` | ≥ 95 | Help, docs, contact |
| Pilot program readiness | `pilot-acquisition.ts` | ≥ 95 | `/pilot-program` live |
| Pilot execution readiness | `pilot-execution-readiness.ts` | ≥ 98 | Demo + personas + assets |
| **Overall production readiness** | 14-dimension average | **≥ 98** | Label: Pilot Execution Ready |

---

## Score tiers (v0.995)

| Score | Label |
|-------|-------|
| ≥ 99 | Enterprise Ready |
| ≥ 98 | **Pilot Execution Ready** |
| ≥ 97 | Production Ready |
| ≥ 90 | Pilot Ready |
| < 90 | Not Ready |

---

## Progression

| Version | Status |
|---------|--------|
| v0.97 | Staging Online Ready |
| v0.98 | Pilot Customer Acquisition Ready |
| v0.99 | Production Deployment Ready |
| **v0.995** | **Pilot Execution Ready** |
| v1.0.0 | GA (target) |

---

## v1.0 RC gate checklist

### Infrastructure
- [x] Deployment readiness dimension
- [x] Public health API + middleware fix
- [x] E2E suite (30 tests)
- [ ] Staging domain live with SSL (operator)

### Demo & simulation
- [x] Demo workspace seed + hardening
- [x] 5 persona organizations
- [x] 4 pilot RBAC accounts
- [x] Customer journey documentation

### Commercial
- [x] Pilot program assets generated
- [x] Founding customer program documented
- [ ] First pilot signed (operator)

### Validation
- [x] lint / typecheck / build scripts
- [ ] 30/30 E2E on staging with demo credentials
- [ ] Diagnostics ≥ 98 on staging demo org

---

## Expected staging scores (fully seeded)

| Dimension | Expected |
|-----------|----------|
| Launch polish | 100 |
| Pilot acquisition | 100 |
| Deployment | 100 |
| Pilot execution | 100 |
| Infrastructure (cron/queue/stripe) | 85–95 |
| **Overall** | **≥ 98** |

Local dev without full infra may score lower — expected.

---

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

---

## Related

- [production-readiness-v0.99.md](./production-readiness-v0.99.md)
- [pilot-execution.md](./pilot-execution.md)
- [pilot-checklist-v1.md](./pilot-checklist-v1.md)
