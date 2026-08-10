# Accessibility / EAA Baseline

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Instruments:** Directive (EU) 2019/882 (EAA) — source mapping REQUIRES LEGAL SOURCE VERIFICATION; WCAG 2.1 AA used as engineering target in existing audit  
**Rule:** No redesign in Part 1. No claim of EAA conformity.

---

## EAA applicability

| Question | Baseline |
|----------|----------|
| Direct EAA obligation? | **POSSIBLE — LEGAL REVIEW REQUIRED** |
| Why uncertain? | EAA covers defined products/services; B2B and microenterprise treatments may apply; German implementation details require counsel |
| Engineering stance | Continue WCAG-oriented improvements regardless of EAA determination |

---

## Existing evidence

| Area | State | Evidence | Notes |
|------|-------|----------|-------|
| WCAG coverage target | DOCUMENTED | `docs/accessibility-audit.md` (Sprint 10, WCAG 2.1 AA pilot target) | Static analysis; not full certified audit |
| Keyboard navigation | PARTIAL | Audit PASS/WARN items; skip links added | Menus warned for arrow-key patterns |
| Focus handling | PARTIAL | `src/lib/a11y/focus.ts`; `focusRing` tokens; dialog patterns | Some custom dialogs historically WARN |
| ARIA | PARTIAL | Labels, dialogs, live regions per audit | Some tab patterns WARN |
| Contrast | PARTIAL | Audit: 1 FAIL historically documented as non-critical | Needs refresh measurement |
| Forms | PARTIAL | Labelled primitives; some WARN on invite/upload | Auth alerts improved |
| Errors | PARTIAL | `FormAlert` / `role="alert"` on auth | Broader consistency TBD |
| Tables | UNVERIFIED_RUNTIME | Design system tables (`AuroraTable*`) | Needs focused audit |
| Dialogs | PARTIAL | ConfirmDialog patterns documented | Focus restore WARN historically |
| Mobile interaction | UNVERIFIED_RUNTIME | Responsive app exists | No dedicated mobile a11y report found |
| Public marketing pages | PARTIAL | Marketing shell + legal pages | Not fully covered by Sprint 10 dashboard-focused audit |
| Authenticated UI | PARTIAL | Dashboard/portal shells with skip links | Primary audit scope |

Build Bible Chapter 10 rules remain always-apply engineering constraints (semantic HTML, focus rings, dialog a11y).

---

## Gap summary

| Gap | Priority |
|-----|----------|
| Legal EAA applicability opinion | HIGH (legal) |
| Refresh accessibility audit (public + app) | HIGH |
| Continuous automated a11y checks in CI | MEDIUM |
| VPAT/ACR if enterprise customers require | MEDIUM |
| Contrast remediation verification | MEDIUM |

---

## Control linkage

- `EAA-A11Y-001`  
- Evidence: `EVD-A11Y-001`, `EVD-A11Y-002`
