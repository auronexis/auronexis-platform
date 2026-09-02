# Compliance Evidence Index

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Rule:** Do not duplicate evidence bodies here — reference paths/systems only.  
**Verification status:** `VERIFIED_PATH` (file/module exists in repo at baseline) | `DOCUMENTED_ONLY` | `UNVERIFIED_RUNTIME`

Last verified: 2026-08-10 (repository path inspection)

---

| Evidence ID | Control IDs supported | File/path/system | Evidence type | Last verified | Verification status |
|-------------|----------------------|------------------|---------------|---------------|---------------------|
| EVD-DOC-001 | CRA-GOV-001, AI-GOV-001 | `docs/compliance/*` (this baseline set) | Documentation | 2026-08-10 | VERIFIED_PATH |
| EVD-DOC-002 | GDPR-DSR-001 | `docs/gdpr.md`, `docs/compliance.md` | Documentation | 2026-08-10 | VERIFIED_PATH |
| EVD-LEGAL-001 | CRA-GOV-001 | `src/lib/company/company-information.ts`, `src/lib/company/legal-content.ts` | Legal entity & product facts | 2026-08-10 | VERIFIED_PATH |
| EVD-LEGAL-002 | CRA-VULN-002 | `src/lib/company/legal-content.ts` (security-policy), marketing `/security-policy` | Public CVD policy text | 2026-08-10 | VERIFIED_PATH |
| EVD-LEGAL-003 | GDPR-SUB-001, NIS2-SUP-001 | `src/lib/company/legal-content.ts` (subprocessors), `/subprocessors` | Subprocessor disclosure | 2026-08-10 | VERIFIED_PATH |
| EVD-LEGAL-004 | GDPR-SUB-001 | `src/lib/company/legal-content.ts` (DPA), `/data-processing-agreement` | DPA content | 2026-08-10 | VERIFIED_PATH |
| EVD-LEGAL-005 | COOKIE-001 | `src/lib/company/legal-content.ts` (cookies/privacy), `/cookies`, `/privacy` | Cookie/privacy disclosures | 2026-08-10 | VERIFIED_PATH |
| EVD-SEC-001 | CRA-VULN-001, CRA-VULN-002 | `src/lib/company/company-contact.ts` (`security@auroranexis.com`) | Security contact | 2026-08-10 | VERIFIED_PATH |
| EVD-CVD-001 | CRA-VULN-002 | `src/app/.well-known/security.txt/route.ts`, `src/lib/security/vulnerability-disclosure.ts`, `src/app/(marketing)/security/vulnerability-disclosure/page.tsx`, `docs/compliance/vulnerability-disclosure-runbook.md` | security.txt + public CVD policy + internal runbook | 2026-08-10 | VERIFIED_PATH |
| EVD-CRA-001 | CRA-VULN-001, CRA-REP-001, GDPR-BREACH-001 | `docs/compliance/cra-reporting-runbook.md`, `cra-incident-classification-matrix.md`, `cra-reporting-role-matrix.md`, `security-incident-evidence-checklist.md`, `cra-reporting-tabletop.md`, `scripts/cra-reporting-readiness.test.mjs` | CRA Art. 14 readiness package (docs + contract tests) | 2026-08-10 | VERIFIED_PATH |
| EVD-SEC-002 | CRA-VULN-001, GDPR-BREACH-001 | `docs/security-operations.md`, `src/lib/compliance/incidents.ts`, `security_incidents` table (migration) | Internal incident registry | 2026-08-10 | VERIFIED_PATH |
| EVD-SEC-003 | CRA-SEC-001, GDPR-SEC-001 | `src/lib/security/*` (CSP, CSRF, headers, rate-limit, login-throttle) | Security controls code | 2026-08-10 | VERIFIED_PATH |
| EVD-SEC-004 | CRA-SEC-001, GDPR-SEC-001 | `docs/security.md`, `docs/security-hardening.md`, `docs/production-security.md` | Security documentation | 2026-08-10 | DOCUMENTED_ONLY |
| EVD-SEC-005 | NIS2-SUP-001 | `docs/security-audit.md`, `docs/security-score.md`, `src/lib/diagnostics/security-readiness.ts` | Security readiness diagnostics | 2026-08-10 | VERIFIED_PATH |
| EVD-AUTH-001 | CRA-SEC-001, GDPR-SEC-001 | `src/lib/rbac/**`, Supabase RLS migrations, `docs/03_SUPABASE_ACCESS_MODEL.md` | AuthZ / tenant isolation | 2026-08-10 | VERIFIED_PATH |
| EVD-COMP-001 | CRA-VULN-001, GDPR-BREACH-001 | `supabase/migrations/20250624130000_audit_compliance_platform.sql`, `src/lib/compliance/**` | Compliance platform DB + modules | 2026-08-10 | VERIFIED_PATH |
| EVD-COMP-002 | GDPR-SEC-001 | `src/lib/audit/**`, `/dashboard/compliance/audit` | Immutable audit trail | 2026-08-10 | VERIFIED_PATH |
| EVD-COMP-003 | GDPR-DSR-001 | `src/lib/compliance/gdpr.ts`, `src/lib/compliance/consent.ts` | DSR/consent registry | 2026-08-10 | VERIFIED_PATH |
| EVD-COMP-004 | DATA-PORT-001, PLD-EVID-001 | `src/lib/compliance/export.ts`, `src/lib/audit/exporter.ts`, `src/lib/governance/evidence.ts` | Audit/evidence export | 2026-08-10 | VERIFIED_PATH |
| EVD-AI-001 | AI-GOV-001, AI-GOV-003 | `src/lib/ai/**`, `docs/ai-copilot-setup.md`, `docs/phase-29-production-openai-integration.md` | AI feature code & docs | 2026-08-10 | VERIFIED_PATH |
| EVD-AI-002 | AI-GOV-002 | `src/lib/ai/copilot/action.ts`, `src/lib/ai/operational/action.ts`, `src/components/operational/ai/operational-ai-diff-preview.tsx` | Generative assist + preview patterns | 2026-08-10 | VERIFIED_PATH |
| EVD-AI-003 | AI-GOV-001 | `src/lib/ai/openai/request-log.ts`, `src/lib/ai/usage/**`, `src/lib/ai/core/observability.ts` | AI usage/logging | 2026-08-10 | VERIFIED_PATH |
| EVD-REL-001 | CRA-DOC-001, PLD-EVID-001 | Git history, `.github/workflows/ci.yml`, `docs/rollback-plan.md`, `docs/enterprise-release-checklist.md` | Release/CI/rollback evidence | 2026-08-10 | VERIFIED_PATH |
| EVD-REL-002 | CRA-SUP-001 | `package.json` (`version`), APP_VERSION usage | Versioning | 2026-08-10 | VERIFIED_PATH |
| EVD-SUP-001 | CRA-SBOM-001 | `package-lock.json`, `package.json` | Dependency lockfile (not SBOM) | 2026-08-10 | VERIFIED_PATH |
| EVD-DR-001 | NIS2-SUP-001, PLD-EVID-001 | `docs/disaster-recovery.md`, `docs/operations-runbook.md` | BCP/DR documentation | 2026-08-10 | DOCUMENTED_ONLY |
| EVD-API-001 | DATA-PORT-001 | `src/app/api/**`, public API docs routes | API capability | 2026-08-10 | VERIFIED_PATH |
| EVD-A11Y-001 | EAA-A11Y-001 | `docs/accessibility-audit.md`, `docs/12_BUILD_BIBLE_V2_CHAPTER_10_ACCESSIBILITY.md` | Accessibility audit/docs | 2026-08-10 | DOCUMENTED_ONLY |
| EVD-A11Y-002 | EAA-A11Y-001 | `src/lib/a11y/focus.ts`, `src/lib/ui/tokens.ts` (`focusRing`) | A11y helpers | 2026-08-10 | VERIFIED_PATH |
| EVD-PRIV-001 | COOKIE-001 | `src/lib/analytics/**`, `src/components/analytics/**`, `docs/13_BUILD_BIBLE_V2_CHAPTER_11_ANALYTICS.md` | Consent-gated analytics architecture | 2026-08-10 | VERIFIED_PATH |
| EVD-CI-001 | CRA-SEC-001, PLD-EVID-001 | `.github/workflows/ci.yml` (lint, typecheck, readiness, build) | Automated quality gates | 2026-08-10 | VERIFIED_PATH |
| EVD-BILL-001 | GDPR-SUB-001 | Mollie PSP billing modules + public subprocessors inventory; FastSpring MoR disclosures are **HISTORICAL_ONLY** | Billing subprocessors | 2026-09-02 | VERIFIED_PATH |

---

## Explicitly missing evidence (baseline)

| Missing | Related controls | Notes |
|---------|------------------|-------|
| `/.well-known/security.txt` | CRA-VULN-002 | Not present in repository search |
| Machine-readable SBOM artifacts | CRA-SBOM-001 | Lockfile ≠ SBOM |
| CRA technical documentation pack | CRA-DOC-001 | Not started |
| ENISA/CSIRT reporting runbook | CRA-VULN-001 | Documented in Part 3 (`cra-reporting-runbook.md`); SRP onboarding still PENDING |
| Recorded CRA tabletop completion | CRA-REP-001 | Drill worksheet exists; execution record empty until operators run it |
| Published support-period / EOL policy | CRA-SUP-001 | Not started |
| Independent pen-test report | GDPR-SEC-001 | Not evidenced in repo |
| Signed AI Act risk classification | AI-GOV-001 | Baseline inventory only |
| Full tenant data-export package | DATA-PORT-001 | Audit/evidence export ≠ full portability |
| ISO/SOC/CE certificates | — | None claimed; none found |

---

## Evidence handling rules

1. Prefer linking existing paths over copying content into compliance docs.  
2. When Part 2+ adds controls, add Evidence IDs here first.  
3. Runtime verification (staging drills) must update `Verification status` and `Last verified`.  
4. Do not cite marketing claims as evidence of legal compliance.
