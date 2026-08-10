# EU Compliance Control Register

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Status:** Canonical control register for Parts 2–12  
**Convention:** IDs `FRAMEWORK-AREA-NNN` · Unverified articles = `ARTICLE TO VERIFY`

Status values: `OPEN` | `IN_PROGRESS` | `IMPLEMENTED` | `PARTIAL` | `DOCUMENTED_ONLY` | `DEFERRED` | `N/A`

---

## CRA — Cyber Resilience Act

### CRA-GOV-001 — CRA scope determination
| Field | Content |
|-------|---------|
| Legal framework | CRA (EU) 2024/2847 |
| Article / Annex | Art. 2–3 (scope/definitions) — ARTICLE TO VERIFY detail |
| Requirement summary | Determine whether Auroranexis is a product with digital elements made available on the Union market |
| Applicability | LEGAL REVIEW REQUIRED |
| Current implementation | PARTIAL — applicability analysis in matrix only |
| Evidence | EVD-DOC-001, EVD-LEGAL-001 |
| Gap | No counsel memo; no documented manufacturer decision |
| Required action | External legal opinion on CRA SaaS scope |
| Owner category | Legal / Founder |
| Priority | CRITICAL (gates conformity path) |
| Deadline | 2026-03-31 (prep for 2026-09-11 reporting if in scope) |
| Verification method | Signed legal memo archived |
| Status | OPEN |

### CRA-VULN-001 — Actively exploited vulnerability & severe incident reporting readiness
| Field | Content |
|-------|---------|
| Legal framework | CRA |
| Article / Annex | Art. 14 (applies from **11 Sep 2026**) |
| Requirement summary | Ability to notify actively exploited vulnerabilities and severe incidents via ENISA single reporting platform / CSIRT coordinators |
| Applicability | IF CRA in scope — treat as HIGH prep regardless until scope closed |
| Current implementation | PARTIAL — security@ contact + internal `security_incidents` registry; no ENISA/CSIRT reporting runbook |
| Evidence | EVD-SEC-001, EVD-SEC-002, EVD-COMP-001 |
| Gap | No CRA reporting procedure, severity mapping, or 24h/72h-style operational timers mapped to Art. 14 stages |
| Required action | Draft CRA reporting runbook; designate on-call owner; monitor ENISA platform readiness |
| Owner category | Security / Engineering / Legal |
| Priority | CRITICAL |
| Deadline | 2026-08-01 (readiness before 2026-09-11) |
| Verification method | Tabletop exercise + documented notification path |
| Status | OPEN |

### CRA-VULN-002 — Coordinated vulnerability disclosure / security contact
| Field | Content |
|-------|---------|
| Legal framework | CRA |
| Article / Annex | Vulnerability handling / CVD — ARTICLE TO VERIFY (Annex I Part II / Art. related) |
| Requirement summary | Public security contact and CVD process |
| Applicability | LIKELY good practice; CRA if in scope |
| Current implementation | PARTIAL — `security@auroranexis.com`; `/.well-known/security.txt`; public `/security/vulnerability-disclosure`; internal runbook `docs/compliance/vulnerability-disclosure-runbook.md` |
| Evidence | EVD-SEC-001, EVD-LEGAL-002, EVD-CVD-001 |
| Gap | Operational drills / metrics not yet evidenced; CRA Art. 14 filing path still open (`CRA-VULN-001`) |
| Required action | Tabletop intake drill; keep Expires strategy reviewed annually |
| Owner category | Security |
| Priority | HIGH |
| Deadline | 2026-06-30 |
| Verification method | Public fetch of security.txt + policy review |
| Status | PARTIAL |

### CRA-DOC-001 — Technical documentation & conformity assessment readiness
| Field | Content |
|-------|---------|
| Legal framework | CRA |
| Article / Annex | Technical documentation / conformity — ARTICLE TO VERIFY; Chapter IV from **11 Jun 2026** (bodies) |
| Requirement summary | Manufacturer technical file; conformity assessment route (likely internal control if default category) |
| Applicability | IF CRA in scope |
| Current implementation | MISSING as CRA dossier |
| Evidence | EVD-REL-001 (release/CI only) |
| Gap | No CRA technical documentation pack, DoC/CE process |
| Required action | After scope opinion: build dossier template |
| Owner category | Engineering / Legal |
| Priority | HIGH |
| Deadline | 2027-06-01 (ahead of 2027-12-11) |
| Verification method | Document checklist audit |
| Status | OPEN |

### CRA-SUP-001 — Support period & end-of-support communication
| Field | Content |
|-------|---------|
| Legal framework | CRA |
| Article / Annex | Support period — ARTICLE TO VERIFY (Recital 60 context; Annex requirements) |
| Requirement summary | Defined support period for vulnerability handling; communicate end of support |
| Applicability | IF CRA in scope |
| Current implementation | MISSING — `package.json` version 1.0.3 only; no published support-period policy |
| Evidence | EVD-REL-002 |
| Gap | No EOL/support-period policy |
| Required action | Define and publish support-period policy after legal review |
| Owner category | Product / Legal |
| Priority | HIGH |
| Deadline | 2027-06-01 |
| Verification method | Policy published + linked from security docs |
| Status | OPEN |

### CRA-SBOM-001 — Component inventory / SBOM readiness
| Field | Content |
|-------|---------|
| Legal framework | CRA |
| Article / Annex | Annex I Part II SBOM-related — ARTICLE TO VERIFY |
| Requirement summary | Machine-readable SBOM / component inventory for products in scope |
| Applicability | IF CRA in scope |
| Current implementation | PARTIAL — `package-lock.json` exists; no SBOM generation/process |
| Evidence | EVD-SUP-001 |
| Gap | No CycloneDX/SPDX SBOM pipeline or retention |
| Required action | Part 2+ implement SBOM generation (not in Part 1) |
| Owner category | Engineering |
| Priority | HIGH |
| Deadline | 2027-06-01 |
| Verification method | SBOM artifact per release |
| Status | OPEN |

### CRA-SEC-001 — Secure development & essential cybersecurity requirements
| Field | Content |
|-------|---------|
| Legal framework | CRA |
| Article / Annex | Essential cybersecurity requirements Annex I — ARTICLE TO VERIFY |
| Requirement summary | Security by design/default; access control; confidentiality/integrity/availability controls |
| Applicability | IF CRA in scope; otherwise security baseline |
| Current implementation | PARTIAL — RLS, RBAC, CSP, CSRF, rate limits, encrypted integration secrets, CI gates |
| Evidence | EVD-SEC-003, EVD-SEC-004, EVD-AUTH-001, EVD-CI-001 |
| Gap | No formal CRA essential-requirements mapping matrix |
| Required action | Map existing controls to Annex I checklist |
| Owner category | Engineering / Security |
| Priority | HIGH |
| Deadline | 2027-06-01 |
| Verification method | Control mapping review |
| Status | PARTIAL |

---

## AI Act

### AI-GOV-001 — AI system inventory & risk classification
| Field | Content |
|-------|---------|
| Legal framework | AI Act (EU) 2024/1689 |
| Article / Annex | Risk classification Art. 6 / Annex III — ARTICLE TO VERIFY application |
| Requirement summary | Inventory AI features; classify risk; document provider/deployer roles |
| Applicability | LIKELY |
| Current implementation | PARTIAL — code modules exist; formal classification memo missing |
| Evidence | EVD-AI-001 |
| Gap | No signed risk classification |
| Required action | Complete inventory in `ai-act-gap-baseline.md` + counsel review |
| Owner category | Legal / Product / Engineering |
| Priority | HIGH |
| Deadline | 2026-07-01 |
| Verification method | Approved classification memo |
| Status | PARTIAL |

### AI-GOV-002 — Transparency & human oversight for generative assistance
| Field | Content |
|-------|---------|
| Legal framework | AI Act |
| Article / Annex | Transparency obligations — ARTICLE TO VERIFY |
| Requirement summary | Users informed they interact with AI; human oversight for decision-support outputs |
| Applicability | POSSIBLE / LIKELY for generative features |
| Current implementation | PARTIAL — UI labels vary; operational AI uses preview/apply patterns in places; not uniformly documented |
| Evidence | EVD-AI-002 |
| Gap | Consistent disclosure & oversight policy |
| Required action | Standardize AI disclosure copy; document human-in-the-loop |
| Owner category | Product / Engineering |
| Priority | MEDIUM |
| Deadline | 2026-08-01 |
| Verification method | UX + policy review |
| Status | OPEN |

### AI-GOV-003 — Prohibited AI practices screening
| Field | Content |
|-------|---------|
| Legal framework | AI Act |
| Article / Annex | Chapter II prohibitions (apply from 2 Feb 2025) |
| Requirement summary | Ensure product does not implement prohibited AI practices |
| Applicability | CONFIRMED screening obligation if AI Act applies |
| Current implementation | UNVERIFIED — no prohibited-use checklist on file |
| Evidence | EVD-AI-001 |
| Gap | Formal screening record |
| Required action | Legal/product screening checklist archived |
| Owner category | Legal / Product |
| Priority | HIGH |
| Deadline | 2026-04-30 |
| Verification method | Signed checklist |
| Status | OPEN |

---

## Product Liability

### PLD-EVID-001 — Release & defect evidence retention
| Field | Content |
|-------|---------|
| Legal framework | PLD (EU) 2024/2853 |
| Article / Annex | Evidence / defectiveness concepts — ARTICLE TO VERIFY |
| Requirement summary | Preserve release, patch, known-defect, and deployment evidence for software placed after 9 Dec 2026 |
| Applicability | LIKELY |
| Current implementation | PARTIAL — git history, CI, rollback/DR docs; no dedicated known-defect register |
| Evidence | EVD-REL-001, EVD-DR-001, EVD-CI-001 |
| Gap | Formal evidence retention schedule |
| Required action | Define retention for releases, incidents, dependency changes, AI model/provider changes |
| Owner category | Engineering / Legal |
| Priority | HIGH |
| Deadline | 2026-10-01 |
| Verification method | Evidence schedule audit |
| Status | OPEN |

---

## GDPR

### GDPR-SEC-001 — Security of processing (Art. 32)
| Field | Content |
|-------|---------|
| Legal framework | GDPR |
| Article / Annex | Art. 32 |
| Requirement summary | Appropriate technical/organizational measures |
| Applicability | CONFIRMED |
| Current implementation | PARTIAL — RLS, RBAC, secrets handling, headers, rate limits, audit events |
| Evidence | EVD-SEC-003, EVD-AUTH-001, EVD-COMP-002 |
| Gap | Formal TOMs document for customers; pen-test evidence cadence |
| Required action | Maintain TOMs pack; schedule independent testing as needed |
| Owner category | Security / Engineering |
| Priority | HIGH |
| Deadline | Ongoing |
| Verification method | Annual TOMs review |
| Status | PARTIAL |

### GDPR-DSR-001 — Data subject request workflow
| Field | Content |
|-------|---------|
| Legal framework | GDPR |
| Article / Annex | Arts. 15–22 |
| Requirement summary | Receive, track, fulfill DSRs |
| Applicability | CONFIRMED |
| Current implementation | PARTIAL — `gdpr_requests` registry/workflow; fulfillment automation incomplete |
| Evidence | EVD-COMP-003, EVD-DOC-002 |
| Gap | End-to-end export/erasure playbooks per data store |
| Required action | Operational DSR runbooks |
| Owner category | Legal Ops / Engineering |
| Priority | HIGH |
| Deadline | 2026-06-30 |
| Verification method | Sample DSR drill |
| Status | PARTIAL |

### GDPR-SUB-001 — Sub-processor transparency
| Field | Content |
|-------|---------|
| Legal framework | GDPR |
| Article / Annex | Art. 28 |
| Requirement summary | Disclose subprocessors; DPA |
| Applicability | CONFIRMED |
| Current implementation | IMPLEMENTED (documentation) — public subprocessors + DPA pages |
| Evidence | EVD-LEGAL-003, EVD-LEGAL-004 |
| Gap | Change-notification process evidence |
| Required action | Log subprocessor change notices |
| Owner category | Legal |
| Priority | MEDIUM |
| Deadline | Ongoing |
| Verification method | Page + change log review |
| Status | PARTIAL |

### GDPR-BREACH-001 — Personal data breach notification readiness
| Field | Content |
|-------|---------|
| Legal framework | GDPR |
| Article / Annex | Arts. 33–34 |
| Requirement summary | 72h authority notification where required; data subject communication |
| Applicability | CONFIRMED |
| Current implementation | PARTIAL — internal incident registry; no authority notification runbook evidenced |
| Evidence | EVD-COMP-001 |
| Gap | Supervisory authority contact path; decision tree |
| Required action | Breach notification runbook (DE DSK/LfDI path) |
| Owner category | Legal / Security |
| Priority | CRITICAL |
| Deadline | 2026-05-31 |
| Verification method | Tabletop |
| Status | OPEN |

---

## Data Act / Portability

### DATA-PORT-001 — Export & switching readiness
| Field | Content |
|-------|---------|
| Legal framework | Data Act (EU) 2023/2854 |
| Article / Annex | Switching / portability chapters — ARTICLE TO VERIFY |
| Requirement summary | Assess export/switching obligations; reduce unfair lock-in |
| Applicability | POSSIBLE |
| Current implementation | PARTIAL — audit/evidence exports; APIs exist; full tenant export unverified |
| Evidence | EVD-COMP-004, EVD-API-001 |
| Gap | Tenant-level portability package |
| Required action | Scope legal applicability; design export package in later part |
| Owner category | Product / Legal / Engineering |
| Priority | MEDIUM |
| Deadline | 2026-12-01 |
| Verification method | Legal memo + export pilot |
| Status | OPEN |

---

## NIS2 / DORA supplier

### NIS2-SUP-001 — Supplier security evidence pack
| Field | Content |
|-------|---------|
| Legal framework | NIS2 (customer-driven) / DORA (if financial customers) |
| Article / Annex | Customer contract — not direct Art. claim without scope |
| Requirement summary | Provide security, incident, BCP/DR, subprocessor, access-control evidence to enterprise customers |
| Applicability | CUSTOMER CONTRACTUAL EXPECTATION |
| Current implementation | PARTIAL — security/DR/compliance docs exist; not packaged as customer assurance kit |
| Evidence | EVD-DR-001, EVD-SEC-005, EVD-LEGAL-003 |
| Gap | Unified customer assurance pack |
| Required action | Assemble non-claiming assurance pack |
| Owner category | Sales Engineering / Security |
| Priority | MEDIUM |
| Deadline | 2026-09-30 |
| Verification method | Pack review |
| Status | OPEN |

---

## Accessibility / EAA

### EAA-A11Y-001 — Accessibility evidence program
| Field | Content |
|-------|---------|
| Legal framework | EAA (EU) 2019/882 |
| Article / Annex | ARTICLE TO VERIFY |
| Requirement summary | If in scope, meet accessibility requirements; regardless, maintain WCAG evidence |
| Applicability | POSSIBLE |
| Current implementation | PARTIAL — Sprint 10 audit; focus helpers; Ch.10 rules |
| Evidence | EVD-A11Y-001, EVD-A11Y-002 |
| Gap | Continuous testing; EAA applicability opinion |
| Required action | Legal applicability + refresh audit |
| Owner category | Product / Engineering / Legal |
| Priority | MEDIUM |
| Deadline | 2026-10-31 |
| Verification method | Audit refresh |
| Status | PARTIAL |

---

## ePrivacy / cookies

### COOKIE-001 — Non-essential tracking consent
| Field | Content |
|-------|---------|
| Legal framework | ePrivacy / TTDSG–TDDDG |
| Article / Annex | REQUIRES LEGAL SOURCE VERIFICATION |
| Requirement summary | Non-essential cookies/trackers only with consent |
| Applicability | LIKELY |
| Current implementation | PARTIAL — consent-gated analytics sinks documented in SEO/analytics chapters |
| Evidence | EVD-PRIV-001 |
| Gap | Counsel verification of banner/runtime behavior |
| Required action | Consent conformance review |
| Owner category | Legal / Engineering |
| Priority | MEDIUM |
| Deadline | 2026-07-31 |
| Verification method | Runtime consent test |
| Status | PARTIAL |
