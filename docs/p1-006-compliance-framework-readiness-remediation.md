# P1-006 — Compliance Framework Readiness Semantics + Production Verification

**Date:** 2026-08-25  
**Scope:** Forensic remediation of Settings → Diagnostics → Compliance platform scoring and labels  
**LIVE charging:** unchanged / fail-closed (`MOLLIE_LIVE_CHARGING_ENABLED` not modified)  
**Commit intent:** local only; no push

---

## A. Executive verdict

**FIXED — NO OPERATOR ACTION**

Production “Framework readiness 18%” was **mathematically consistent** with the old composite formula plus **inflated hardcoded control baselines** (not a broken schema). Semantics and UI incorrectly implied platform/certification failure. Remediation separates **platform capability** from **workspace compliance maturity**, removes invented control evidence, renames labels, and stops tenant maturity from discounting production go-live compliance readiness.

Empty-workspace maturity near **0%** with **tables reachable = Yes** is now the truthful, expected state.

---

## B. Forensic trace (code paths)

| Concern | Source |
|---------|--------|
| Diagnostics snapshot | `src/lib/compliance/diagnostics.ts` → `getComplianceDiagnosticsSnapshot` |
| Dashboard maturity | `src/lib/compliance/repository.ts` → `getComplianceDashboardData` |
| Overall maturity formula | `src/lib/governance/readiness.ts` → `calculateOverallReadiness` |
| Pure formula (testable) | `src/lib/governance/maturity-formula.ts` → `computeWorkspaceComplianceMaturity` |
| Per-framework % | `calculateFrameworkReadiness` + `FRAMEWORK_CONTROL_MAP` |
| Control scores / evidence | `src/lib/governance/controls.ts` → `evaluateControlScores` |
| Framework map (code-defined) | `src/lib/governance/frameworks.ts` |
| Retention coverage | `src/lib/compliance/retention.ts` → `getRetentionCoveragePercent` |
| Active policies | `src/lib/compliance/policies.ts` → `countActivePolicies` |
| Tables probe | `src/lib/compliance/security.ts` → `complianceTablesReachable` |
| Production readiness | `src/lib/diagnostics/production-readiness.ts` → `computeProductionReadiness` |
| Diagnostics UI | `src/components/settings/diagnostics-panel.tsx` |
| Compliance UI | `src/components/compliance/compliance-workspace.tsx` |
| Schema | `supabase/migrations/20250624130000_audit_compliance_platform.sql` |

No separate DB tables for global framework/control definitions — maps live in TypeScript (`GOVERNANCE_CONTROLS`, `FRAMEWORK_CONTROL_MAP`).

---

## C. Exact pre-fix “Framework readiness” formula

Diagnostics field `frameworkReadinessPercent` = `calculateOverallReadiness().readinessPercent`:

```
readinessPercent = round(
  retentionCoveragePercent * 0.2
  + min(activePolicies * 10, 30)
  + (auditEventsTotal > 0 ? 20 : 0)
  + (auditGrowth7d > 0 ? 5 : 0)
  + controlAverage * 0.3
)
```

`controlAverage` = mean of 16 governance control scores from `evaluateControlScores`.

**Observed 18% reconstruction (empty tenant + old baselines):**  
retention/policies/audit = 0; `controlAverage ≈ 58.4` → `58.4 × 0.3 ≈ 17.5` → **18%**.

---

## D. Classification (A–G)

| Code | Finding |
|------|---------|
| **A** | Partially — low maturity for empty tenant is expected |
| **B** | Yes — label said “Framework readiness” but value was overall composite maturity |
| **C** | Soft — defaults only seeded on Compliance Center visit; diagnostics correctly showed 0 |
| **D** | Yes — `evidenceAvailable: score >= 50` invented evidence; many controls hardcoded (e.g. identity 85) |
| **E** | Soft — 0 policies/retention valid until configured |
| **F** | Partial — production readiness already soft-penalized maturity; still coupled |
| **G** | **Mixture (primary verdict)** |

---

## E. Database reality

| Object | Reality |
|--------|---------|
| `audit_events`, `audit_exports`, `compliance_policies`, `retention_rules`, `gdpr_requests`, `security_incidents`, … | Present in `20250624130000_audit_compliance_platform.sql` |
| Global framework/control seed tables | **None** — code maps are canonical |
| Tenant evidence/attestations in migrations | **None** (correct — do not fake) |
| New migration this ticket | **Not required** |

---

## F. Score semantics (after fix)

| Signal | Meaning |
|--------|---------|
| `tablesReachable` / `platformCapabilityPercent` | Platform schema availability (0 or 100) |
| `workspaceComplianceMaturityPercent` (= `frameworkReadinessPercent` alias) | Tenant maturity via formula above |
| Per-framework `%` | Mean of mapped control scores (evidence-gated) |
| `implementedControls` | Count only where `evidenceAvailable && status !== "fail"` |
| Production `complianceReadiness` | **90 if tables reachable, else 40** — ignores tenant maturity |

---

## G. Control evidence rules (honest)

- No `evidenceAvailable: score >= 50`.
- Zero open incidents ≠ incident program (requires recorded incidents).
- No hardcoded identity/monitoring/backups “pass” without tenant signals.
- Active policies, retention rules, audit rows, vault secrets, exports drive evidence.
- Platform-only signals (API table probe, encryption key alone) do **not** inflate tenant maturity.

---

## H. UI language changes

| Before | After |
|--------|-------|
| Framework readiness | Workspace compliance maturity |
| Evidence available | Audit evidence present |
| Compliance readiness (production) | Compliance readiness (platform) |
| Framework readiness cards | Framework evidence coverage |
| Dashboard “Readiness” | Framework maturity + “not certification” |

Helper copy: workspace-specific; not certification; low ≠ infrastructure broken; increases with policies/evidence/retention.

---

## I. Empty-state quality

0 audit / policies / retention / evidence render as **not yet configured** (neutral), not red infrastructure failure. `tablesReachable=Yes` + low maturity = healthy empty workspace.

---

## J. Framework cards (SOC 2 / ISO 27001 / GDPR / NIS2 / DORA / HIPAA)

- Numerator: evidenced non-fail controls in `FRAMEWORK_CONTROL_MAP[framework]`.
- Denominator: mapped control count.
- `%`: mean of those control scores (zeros included — missing not ignored).
- Labels retain “(readiness)” for HIPAA; no certification claim.

---

## K. Production readiness aggregation

Tenant maturity **no longer** reduces `complianceReadiness`. Go-live uses platform table reachability only. Intentional hard gates elsewhere unchanged.

---

## L. Policy / retention seeding

- Policy scaffolding: **draft-only**, insert-if-missing (never overwrite active).
- Retention scaffolding: insert-if-missing simulation rules; no overwrite.
- No fake audit events, GDPR rows, incidents, or attestations.

---

## M. Tests added

- `scripts/p1-006-compliance-framework-readiness.test.mjs`
- `npm run test:p1-006-compliance-readiness`
- Updated `scripts/final-production-closeout.test.mjs` (no `maturityPercent` coupling)

Coverage: empty/partial/mature formulas; evidence gate; platform vs maturity; UI language; draft seeds; no certification claims; Mollie LIVE gate untouched.

---

## N. Quality gates

| Command | Result |
|---------|--------|
| `npm run lint` | PASS (pre-existing warnings only) |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run test:production-readiness` | PASS |
| `npm run test:definition-of-done` | PASS |
| `npm run test:enterprise-certification` | PASS |
| `npm run test:enterprise-release-approval` | PASS |
| `npm run test:enterprise-production-golive` | PASS |
| `npm run test:enterprise-regression` | PASS (383) |
| `npm run test:p1-006-compliance-readiness` | PASS (13) |
| `npm run test:final-production-closeout` | PASS (30) |

---

## O. Safety checklist

| Item | Status |
|------|--------|
| Secrets exposure | None |
| Mollie LIVE charging flag | Unchanged / fail-closed |
| RLS / RBAC | Unchanged |
| Fake compliance/audit/evidence data | Not created |
| Unrelated billing/auth | Untouched |

---

## P. Operator actions

**None required** for this semantic fix. Optional (maturity only, not go-live):

1. Open Compliance Center → activate draft policies as needed  
2. Confirm retention simulation rules  
3. Generate audit activity / evidence export when documenting controls  

---

## Q. Final verdict

**FIXED — NO OPERATOR ACTION**

Truthful, deterministic scores; impossible to confuse empty-tenant maturity with platform failure or certification.
