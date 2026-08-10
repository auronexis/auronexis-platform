# NIS2 / DORA Supplier-Readiness Baseline

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Rule:** Do not force direct NIS2/DORA applicability onto Auroranexis without size/sector legal analysis.

---

## Direct applicability

| Framework | Direct legal obligation? | Confidence | Notes |
|-----------|--------------------------|------------|-------|
| NIS2 (EU) 2022/2555 | **UNVERIFIED / LIKELY NOT without thresholds** | POSSIBLE | SaaS/cloud can be in scope when entity size/sector criteria met. Auroranexis is a German sole proprietorship B2B SaaS; **no designation evidence** in repo. |
| German NIS2 transposition | REQUIRES LEGAL SOURCE VERIFICATION | POSSIBLE | Counsel to map entity class |
| DORA (EU) 2022/2554 | **NOT APPLICABLE** as financial entity on current evidence | NOT APPLICABLE (direct) | May apply as **ICT third-party** to financial customers |

Classification used below:

- `DIRECT LEGAL OBLIGATION` — only if counsel confirms entity in scope  
- `CUSTOMER CONTRACTUAL EXPECTATION` — typical enterprise/NIS2/DORA customer asks  
- `NOT CURRENTLY RELEVANT` — no evidence of need today  

---

## Supplier readiness matrix

| Customer ask | Classification | Current Auroranexis evidence | Gap |
|--------------|----------------|------------------------------|-----|
| Incident notification commitments | CUSTOMER CONTRACTUAL EXPECTATION | Internal `security_incidents`; security@; no standard customer SLA template evidenced | Draft contractual notification language (legal) |
| Security controls summary | CUSTOMER CONTRACTUAL EXPECTATION | `docs/security*.md`, RLS/RBAC, CSP/CSRF, diagnostics | Customer-facing TOMs pack (no certification claims) |
| Business continuity | CUSTOMER CONTRACTUAL EXPECTATION | `docs/disaster-recovery.md` (RTO 4h / RPO ≤24h targets) | Confirm restore drills archived |
| Subprocessor list | CUSTOMER CONTRACTUAL EXPECTATION | Public `/subprocessors` | Change-notification log |
| Audit rights | CUSTOMER CONTRACTUAL EXPECTATION | Audit explorer for tenants; no third-party audit report evidenced | Define audit clause limits |
| Vulnerability management | CUSTOMER CONTRACTUAL EXPECTATION | CVD policy text; security@ | Formal vuln SLAs + scanning cadence |
| Access control | CUSTOMER CONTRACTUAL EXPECTATION | RBAC + RLS | Access review evidence |
| Encryption | CUSTOMER CONTRACTUAL EXPECTATION | TLS; secret encryption; provider at-rest claims need archive | Provider attestations folder |
| BCP / DR | CUSTOMER CONTRACTUAL EXPECTATION | DR + rollback + ops runbook | Customer BCP summary |
| Logging / monitoring | CUSTOMER CONTRACTUAL EXPECTATION | Audit events, activity, health endpoints | Retention & monitoring overview |
| Risk management | CUSTOMER CONTRACTUAL EXPECTATION | Compliance center readiness scores (internal; not certification) | Avoid presenting scores as certificates |
| Supply-chain security | CUSTOMER CONTRACTUAL EXPECTATION | Lockfile only | SBOM/dependency monitoring (later) |
| NIS2 authority reporting by Auroranexis | DIRECT LEGAL OBLIGATION only if in scope | Missing | Legal entity-scope opinion first |
| DORA register / oversight duties as financial entity | NOT CURRENTLY RELEVANT | N/A | Revisit if financial-sector GTM |
| DORA ICT third-party clauses | CUSTOMER CONTRACTUAL EXPECTATION if pursuing banks/insurers | Partial security/DR | DORA annex questionnaire pack |

---

## Readiness score (supplier posture — not legal compliance)

| Area | Score (0–5) | Rationale |
|------|-------------|-----------|
| Security control narrative | 3 | Solid engineering controls; packaging incomplete |
| Incident process | 2 | Internal registry; external notification path weak |
| BCP/DR | 3 | Documented; drill evidence weak |
| Supply chain | 1 | Lockfile only |
| Customer assurance pack | 1 | Not assembled |
| **Overall supplier readiness** | **2 / 5** | Suitable start; not enterprise-questionnaire complete |

---

## Actions for later parts

1. Legal memo: NIS2 entity scope for Auroranexis AI Solutions.  
2. Assemble customer assurance pack (no fake ISO/SOC badges).  
3. Define incident customer-notification targets contractually.  
4. If financial GTM: DORA ICT third-party questionnaire responses.
