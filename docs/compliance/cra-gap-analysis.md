# CRA Gap Analysis

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Instrument:** Regulation (EU) 2024/2847  
**Source:** https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R2847  
**Applicability:** POSSIBLE — LEGAL REVIEW REQUIRED (see applicability matrix)  
**Provisional category if in scope:** Default (not Annex III Class I/II; not Annex IV critical) — provisional  

Engineering priority: `P0` | `P1` | `P2` | `P3`

---

## Scope & role (precondition)

| Topic | CURRENT STATE | GAP | RISK | ACTION | LEGAL DEADLINE | ENGINEERING PRIORITY |
|-------|---------------|-----|------|--------|----------------|----------------------|
| Product with digital elements | Commercial B2B browser SaaS; cloud-hosted; no hardware | Unclear if CRA product vs NIS2 cloud service framing (Recital 12) | Wrong investment path / missed reporting | Legal opinion | Before 2026-09-11 if reporting binds | P0 |
| Manufacturer role | Sole software producer | No manufacturer designation record | Unowned obligations | Decide & document | 2026-03-31 | P0 |
| Remote data processing | Entire product is remote SaaS | Whether SaaS backend is CRA remote data processing tied to a PDE | Scope error | Legal analysis | 2026-03-31 | P0 |
| Annex III/IV class | No clear match to listed important/critical core functionalities | None forced | Over-classification cost | Keep provisional default | N/A until opinion | P2 |

---

## Essential cybersecurity & secure development

| Topic | CURRENT STATE | GAP | RISK | ACTION | LEGAL DEADLINE | ENGINEERING PRIORITY |
|-------|---------------|-----|------|--------|----------------|----------------------|
| Security by design | RLS, RBAC, CSP, CSRF, secret encryption, server-only AI | No CRA Annex I mapping | Incomplete conformity story | Map controls → Annex I checklist | 2027-12-11 (prep 2027-06-01) | P1 |
| Security by default | Auth required for app; plan/RBAC gates | No formal secure-default policy doc | Audit gap | Document defaults | 2027-06-01 | P2 |
| Risk assessment | Threat notes in `docs/security.md`; diagnostics | No lifecycle CRA risk assessment process | Undetected residual risk | Introduce lightweight risk assessment cadence | 2027-06-01 | P1 |
| Access control | Supabase Auth + RBAC + RLS | Continuous access reviews undocumented | Privilege creep | Access review runbook | Ongoing / 2027-06-01 | P1 |
| Authentication | Supabase Auth, login throttle, Turnstile on forms | MFA policy evidence incomplete | Account takeover | Document auth guarantees & MFA roadmap | 2027-06-01 | P1 |
| Encryption | TLS via hosting; integration secrets AES-GCM | Data-at-rest attestation from Supabase not archived here | Confidentiality evidence gap | Archive provider encryption evidence | 2027-06-01 | P2 |
| Confidentiality / integrity / availability | Multi-control; DR RTO/RPO documented | Availability SLO customer packing incomplete | Customer trust / CRA essential reqs | Tie DR to customer commitments carefully (no overclaim) | 2027-06-01 | P2 |
| Attack surface reduction | Private route noindex; rate limits; outbound URL checks | No formal attack-surface register | Unknown exposure | Maintain public endpoint inventory | 2027-06-01 | P2 |
| Logging | Audit events, activity, AI request logs | CRA-oriented security logging retention policy incomplete | Forensics / reporting lag | Define security log retention | 2026-08-01 | P1 |

---

## Vulnerability & incident handling

| Topic | CURRENT STATE | GAP | RISK | ACTION | LEGAL DEADLINE | ENGINEERING PRIORITY |
|-------|---------------|-----|------|--------|----------------|----------------------|
| Vulnerability handling | security@ + policy text; npm lockfile | No intake triage SLAs, CVE tracking tool, patch SLAs | Missed exploited vuln reporting | CVD ops + vuln tracker | **2026-09-11** (Art. 14) | P0 |
| Coordinated vulnerability disclosure | Policy on security-policy page | No `security.txt`; limited process metrics | Reports lost / delayed | Add security.txt + CVD runbook | 2026-06-30 | P0 |
| Security contact | `security@auroranexis.com` CONFIRMED in code | Contact not in well-known security.txt | Discoverability | Publish security.txt | 2026-06-30 | P0 |
| Vulnerability reporting readiness (Art. 14) | Internal `security_incidents` only | No ENISA single-platform / CSIRT procedure | Regulatory breach if in scope | Reporting runbook + tabletop | **2026-09-11** | P0 |
| Incident reporting readiness | Internal registry + DR docs | No CRA severe-incident definition mapping | Late/missed notification | Map severities to Art. 14 | **2026-09-11** | P0 |
| Security update process | Vercel deploy + CI | No published security-update policy | Users unaware of patches | Document update cadence | 2027-06-01 | P1 |
| Automatic updates | SaaS continuous deploy (server-side) | Client expectation unclear; not CRA “automatic update” for installed software | Misaligned expectations | Document SaaS update model | 2027-06-01 | P2 |
| Patch delivery | Production deploys | No customer-facing security bulletin process | Trust / PLD overlap | Security bulletin template | 2026-09-11 | P1 |

---

## Support period & lifecycle

| Topic | CURRENT STATE | GAP | RISK | ACTION | LEGAL DEADLINE | ENGINEERING PRIORITY |
|-------|---------------|-----|------|--------|----------------|----------------------|
| Support period | Version `1.0.3` only | No minimum support-period commitment | CRA nonconformity if in scope | Define support period policy | 2027-12-11 | P1 |
| End-of-support communication | Missing | Customers not informed of EOL | Unsupported exposure | EOL communication plan | 2027-12-11 | P2 |

---

## Documentation, SBOM, supply chain

| Topic | CURRENT STATE | GAP | RISK | ACTION | LEGAL DEADLINE | ENGINEERING PRIORITY |
|-------|---------------|-----|------|--------|----------------|----------------------|
| Technical documentation | Engineering docs only | No CRA technical file | Cannot declare conformity | Dossier template after scope yes | 2027-12-11 | P1 |
| Dependency / component inventory | `package-lock.json` | Not release-gated SBOM | Supply-chain opacity | SBOM generation (later part) | 2027-12-11 | P1 |
| SBOM readiness | Missing | Missing machine-readable SBOM | Annex I gap if in scope | CycloneDX/SPDX in CI | 2027-12-11 | P1 |
| Third-party component monitoring | Manual / ad hoc | No continuous CVE monitoring evidenced | Exploited component risk | Dependency scanning process | 2026-09-11 | P0 |
| Release traceability | Git + CI | No signed release bill of materials | Weak PLD/CRA evidence | Release evidence checklist | 2026-10-01 | P1 |
| Secure development lifecycle | Practices exist; not named SDLC | Unformalized | Audit friction | Lightweight SDLC policy | 2027-06-01 | P2 |

---

## User information & conformity

| Topic | CURRENT STATE | GAP | RISK | ACTION | LEGAL DEADLINE | ENGINEERING PRIORITY |
|-------|---------------|-----|------|--------|----------------|----------------------|
| User security information | Security pages + docs | No CRA-mandated user instructions pack | Information obligation gap | Security information for users/admins | 2027-12-11 | P2 |
| Conformity assessment readiness | N/A | No module A / internal control plan | Late scramble | Plan after scope opinion | 2027-12-11 | P1 |
| CE / EU declaration implications | None | Unknown if CE marking applies to software PDE | Legal/marketing error if claimed early | Counsel only; **no CE claims now** | 2027-12-11 | P1 |

---

## Summary

Highest CRA residual risks before 2026-09-11:

1. Scope undecided while Art. 14 date approaches.  
2. No ENISA/CSIRT reporting runbook.  
3. No formal vuln intake/CVE monitoring ops.  
4. No security.txt.  

Do **not** claim CRA compliance. Treat this analysis as preparation inventory only.
