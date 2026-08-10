# Compliance Risk Register

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Severity rules:** `CRITICAL` reserved for urgent legal/operational exposure with near-term deadlines or live duties. Do not inflate.

Status: `OPEN` | `MITIGATING` | `ACCEPTED` | `CLOSED`

---

## CRITICAL

### RISK-001 — CRA Article 14 reporting unpreparedness while scope undecided
| Field | Content |
|-------|---------|
| Framework | CRA |
| Risk | If CRA applies, inability to report actively exploited vulnerabilities / severe incidents from **11 Sep 2026** |
| Likelihood | MEDIUM (scope uncertain; date certain) |
| Impact | HIGH (regulatory enforcement if in scope) |
| Legal deadline | 2026-09-11 |
| Current control | Part 3 CRA reporting runbook + matrix + roles + evidence checklist + tabletop; Part 2 CVD; internal incident registry; SRP onboarding PENDING |
| Residual risk | MEDIUM |
| Required remediation | Legal scope opinion; SRP onboarding; execute recorded tabletop |
| Owner | Legal + Security |
| Status | MITIGATING |

### RISK-002 — GDPR personal-data breach notification path incomplete
| Field | Content |
|-------|---------|
| Framework | GDPR Arts. 33–34 |
| Risk | Delayed or missed supervisory authority / data-subject notification |
| Likelihood | MEDIUM |
| Impact | HIGH (statutory duty already live) |
| Legal deadline | Immediate / ongoing (72h clock when breach confirmed) |
| Current control | Internal security incident registry |
| Residual risk | HIGH |
| Required remediation | DE authority notification runbook + decision tree |
| Owner | Legal + Security |
| Status | OPEN |

---

## HIGH

### RISK-003 — AI Act role/risk classification undocumented
| Field | Content |
|-------|---------|
| Framework | AI Act |
| Risk | Incorrect assumptions (under/over control); transparency gaps by 2 Aug 2026 |
| Likelihood | MEDIUM |
| Impact | HIGH |
| Legal deadline | 2026-08-02 (general application); prohibitions already applicable |
| Current control | Feature inventory baseline; technical safeguards |
| Residual risk | MEDIUM-HIGH |
| Required remediation | Counsel-approved classification + disclosure standards |
| Owner | Legal + Product |
| Status | OPEN |

### RISK-004 — No machine-readable SBOM / weak dependency monitoring
| Field | Content |
|-------|---------|
| Framework | CRA (if in scope) + supplier expectations |
| Risk | Unknown exploited components; inability to produce SBOM |
| Likelihood | HIGH |
| Impact | MEDIUM-HIGH |
| Legal deadline | CRA main 2027-12-11; operational urgency earlier for Art. 14 prep |
| Current control | package-lock.json |
| Residual risk | HIGH |
| Required remediation | Dependency scanning + SBOM pipeline (later part) |
| Owner | Engineering |
| Status | OPEN |

### RISK-005 — Product liability evidence retention not formalized before 9 Dec 2026
| Field | Content |
|-------|---------|
| Framework | PLD |
| Risk | Inability to evidence development/update/defect state in a claim |
| Likelihood | MEDIUM |
| Impact | HIGH |
| Legal deadline | 2026-12-09 |
| Current control | Git/CI/DR docs |
| Residual risk | MEDIUM-HIGH |
| Required remediation | Evidence retention schedule + known-defect register |
| Owner | Engineering + Legal |
| Status | OPEN |

### RISK-006 — CVD discoverability gap (no security.txt)
| Field | Content |
|-------|---------|
| Framework | CRA / security good practice |
| Risk | Vulnerability reports delayed or misrouted |
| Likelihood | LOW (after Part 2) |
| Impact | MEDIUM-HIGH |
| Legal deadline | Prep by 2026-06-30; CRA Art. 14 2026-09-11 |
| Current control | security@ + `/.well-known/security.txt` + `/security/vulnerability-disclosure` + internal runbook |
| Residual risk | LOW-MEDIUM |
| Required remediation | Intake tabletop; monitor mailbox delivery |
| Owner | Security / Engineering |
| Status | MITIGATING |

---

## MEDIUM

### RISK-007 — Data Act / switching applicability unclear; export incomplete
| Field | Content |
|-------|---------|
| Framework | Data Act / GDPR portability |
| Risk | Contractual or regulatory switching friction |
| Likelihood | MEDIUM |
| Impact | MEDIUM |
| Legal deadline | Counsel-driven; target decision 2026-12-01 |
| Current control | Partial exports/APIs |
| Residual risk | MEDIUM |
| Required remediation | Legal memo + export scope design |
| Owner | Legal + Product |
| Status | OPEN |

### RISK-008 — NIS2 entity scope unknown; supplier pack weak
| Field | Content |
|-------|---------|
| Framework | NIS2 |
| Risk | Missed direct duties **or** lost enterprise deals for lack of assurance pack |
| Likelihood | MEDIUM |
| Impact | MEDIUM |
| Legal deadline | Entity opinion ASAP; pack by 2026-09-30 |
| Current control | Security/DR documentation fragments |
| Residual risk | MEDIUM |
| Required remediation | Legal opinion + assurance pack |
| Owner | Legal + Sales Eng |
| Status | OPEN |

### RISK-009 — Cookie/tracker consent conformance not counsel-verified
| Field | Content |
|-------|---------|
| Framework | ePrivacy / TTDSG–TDDDG |
| Risk | Non-essential tracking before consent |
| Likelihood | MEDIUM |
| Impact | MEDIUM |
| Legal deadline | Ongoing |
| Current control | Consent-gated analytics architecture |
| Residual risk | MEDIUM |
| Required remediation | Runtime legal review |
| Owner | Legal + Engineering |
| Status | OPEN |

### RISK-010 — EAA applicability and a11y evidence aging
| Field | Content |
|-------|---------|
| Framework | EAA / WCAG |
| Risk | Accessibility obligation surprise or enterprise questionnaire failure |
| Likelihood | MEDIUM |
| Impact | MEDIUM |
| Legal deadline | After EAA opinion; audit refresh 2026-10-31 |
| Current control | Sprint 10 audit + a11y helpers |
| Residual risk | MEDIUM |
| Required remediation | Legal opinion + audit refresh |
| Owner | Legal + Product |
| Status | OPEN |

---

## LOW

### RISK-011 — DSA core platform obligations unlikely but unconfirmed
| Field | Content |
|-------|---------|
| Framework | DSA |
| Risk | Unexpected intermediary classification |
| Likelihood | LOW |
| Impact | MEDIUM |
| Legal deadline | Confirmatory memo |
| Current control | B2B SaaS model |
| Residual risk | LOW |
| Required remediation | Short counsel confirmation |
| Owner | Legal |
| Status | OPEN |

### RISK-012 — Premature public compliance marketing
| Field | Content |
|-------|---------|
| Framework | All |
| Risk | Misleading “CRA/AI Act/NIS2 compliant” claims |
| Likelihood | LOW (process control) |
| Impact | HIGH if occurs |
| Legal deadline | Continuous |
| Current control | Part 1 hard rule: no claims/badges |
| Residual risk | LOW |
| Required remediation | Marketing review gate |
| Owner | Marketing + Legal |
| Status | MITIGATING |

---

## Risk summary counts

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 4 |
| MEDIUM | 4 |
| LOW | 2 |
