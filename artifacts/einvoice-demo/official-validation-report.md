# Official E-Invoice Validation Report

**Verdict candidate:** `EINVOICE_OFFICIALLY_VALIDATED_READY_FOR_OPERATOR_APPROVAL`

**Scope:** Additive ZUGFeRD / Factur-X EN 16931 module only. Not FeRD certification of Auroranexis as a product. Not production delivery. PDF/A-3 out of scope.

**Disclaimer:** DEMO/NOT LEGAL synthetic samples. EXTERNAL_TAX_REVIEW_REQUIRED. Operator approval required before any customer delivery or production integration.

---

## 0. Git safety

| Item | Value |
|------|--------|
| Repository | `D:\Projekt.01\Auroranexis` |
| Branch | `main` |
| Production baseline | `99ee628` |
| Starting local commit under review | `3616652` (`feat: add additive ZUGFeRD EN16931 e-invoice module`) |
| `origin/main` | `99ee628` (unchanged) |
| Ancestor check | `99ee628` is ancestor of `3616652` |
| Push | NO |
| Deploy | NO |
| `MOLLIE_LIVE_CHARGING_ENABLED` | false (no live charging enabled) |

### Immutable file list `99ee628..3616652` (classification)

**Category A — additive E-Invoice (12):**

- `src/lib/einvoice/artifacts.ts`
- `src/lib/einvoice/demo/samples.ts`
- `src/lib/einvoice/filename.ts`
- `src/lib/einvoice/index.ts`
- `src/lib/einvoice/money.ts`
- `src/lib/einvoice/pipeline.ts`
- `src/lib/einvoice/profile.ts`
- `src/lib/einvoice/source-adapter.ts`
- `src/lib/einvoice/tax-category.ts`
- `src/lib/einvoice/types.ts`
- `src/lib/einvoice/validation.ts`
- `src/lib/einvoice/zugferd-generator.ts`

**Category B — test / demo / artifacts (10):**

- `artifacts/einvoice-demo/*` (8 files)
- `scripts/einvoice-additive.test.mjs`
- `scripts/einvoice-demo-generate.mjs`

**Category C — Billing / Tax / Mollie / Invoice infra:** **0**

→ No `EINVOICE_BILLING_FREEZE_VIOLATION`.

---

## 1. Official FeRD / Factur-X package provenance

FeRD website download requires interactive registration; direct package ZIP was not obtainable in this unattended environment. Validation used the **Factur-X 1.09.2 / ZUGFeRD 2.5.2** artifacts embedded in Mustangproject CLI **2.26.0** (Apache-2.0), which declare:

- Schematron title: `Schema for Factur-X; 1.09.2; EN16931-COMPLIANT (FULLY)`
- Codedb metadata: `Version: 1.09.2`, `Release date: 2026-08-04`, `Effective date: 2026-09-01`
- Rule `CII-SR-470` present (ZUGFeRD 2.5.2 rename of BR-CO-27)
- Guideline codedb (`cl id=1`) for EN16931: **only** `urn:cen.eu:en16931:2017`

| Artifact | Path (ephemeral tooling, not committed) | SHA-256 |
|----------|-------------------------------------------|---------|
| Mustang CLI | `.tmp_einvoice_official/Mustang-CLI-2.26.0.jar` | `42D7868CB68264874A7B8CAB4C3587B03B23CCC7CD72373DA917F66758BB9736` |
| XSD | `schema/ZF_250/EN16931/FACTUR-X_EN16931.xsd` | `34E51A9B26C95EF6E09297051B9921A05279A4024E659F236BA5D5E0F5A23BEC` |
| Schematron | `schematron/ZF_250/FACTUR-X_EN16931.sch` | `1AD7179C982B562E6FD0D09CAE285B92A8348D6CB8035069CFFDE95BACF0C5FE` |
| XSLT | `xslt/ZF_250/FACTUR-X_EN16931.xslt` | `D412C035CD790E0EA0DE36B59F58A868F4D1A28BC2072FC2204F23DBEB2850D7` |
| Code lists | `schematron/ZF_250/FACTUR-X_EN16931_codedb.xml` | `DD3856984B69E25D5BA6312EC7C8F68E4458064A5998BEBCFE8AE66DE1A21CAD` |

**Profile:** EN16931 (not MINIMUM / BASIC-WL / BASIC)  
**CII:** UN/CEFACT CrossIndustryInvoice (D22B namespaces as in Factur-X 1.09.2)  
**Standard:** ZUGFeRD 2.5.2 / Factur-X 1.09.2 / EN 16931  

Cross-check: official Factur-X EN16931 fixture from `akretion/factur-x` (guideline `urn:cen.eu:en16931:2017`) validates `XML:valid` under the same Mustang package.

---

## 2. Defects found by adversarial official validation (pre-fix)

Mustang validation of the **pre-remediation** demos failed with:

1. **XSD ERROR** — `BillingSpecifiedPeriod` placed before `ApplicableTradeTax` (wrong `HeaderTradeSettlement` sequence).
2. **Schematron ERROR `FX-SCH-A-000556`** — BT-24 guideline used obsolete URN `urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931`; Factur-X 1.09.2 EN16931 codedb allows only `urn:cen.eu:en16931:2017`.
3. **Warning `PEPPOL-EN16931-R008` (R74)** — empty `<ram:ApplicableHeaderTradeDelivery/>`.
4. TradeTax child order risk — `ExemptionReason` must precede `BasisAmount` per XSD.

**Remediation (additive module only):**

- Guideline URN → `urn:cen.eu:en16931:2017`
- Settlement order: taxes then billing period
- Non-empty delivery with `ActualDeliverySupplyChainEvent` / BT-72 date
- AE: emit structured `ExemptionReasonCode` `VATEX-EU-AE` + reason text
- TradeTax XSD element order corrected
- Internal validator strengthened (R008 / XSD order / BR-AE-10)

Demos regenerated from code after fixes.

---

## 3. Exact files validated (post-fix bytes)

| File | SHA-256 |
|------|---------|
| `artifacts/einvoice-demo/TEST-EINV-2026-000001.xml` | `0BA0F43350081C02F997FE18452304AEDCB671AC66579F437F0889A28DA247F7` |
| `artifacts/einvoice-demo/TEST-EINV-RC-2026-000001.xml` | `77727E4B1B43762148BC193AA8ECB7BB277C93A6D7C6063A6882BDFB28DEB3FC` |

Validator: `java -jar Mustang-CLI-2.26.0.jar --action validate --source <file>`

### DEMO DE (`TEST-EINV-2026-000001.xml`)

| Layer | Result |
|-------|--------|
| Well-formed XML | PASS |
| Official XSD (FACTUR-X_EN16931) | PASS |
| Official Schematron/XSLT EN16931 | PASS (zero ERROR/FATAL) |
| Mustang summary | `<summary status="valid"/>` / `XML:valid` |
| R74 / PEPPOL-EN16931-R008 empty elements | PASS (no empty self-closing elements; no R008 warning) |
| Arithmetic 503.36 / 95.64 / 599.00 / 19% / S / 380 | PASS |
| Business rules (in-module) | PASS |

**Notices reviewed (non-blocking for Factur-X EN16931 B2B):** XRechnung CIUS notices only (`PEPPOL-EN16931-R001`, `R020`, `BR-DE-1`, `BR-DE-15`, `BR-DE-21`, `BR-DE-2`) from `/xslt/XR_30/…` — XRechnung public-sector CIUS, not Factur-X EN16931 hard failures. Official sample also carries XR notices while remaining `XML:valid`.

### DEMO EU-RC (`TEST-EINV-RC-2026-000001.xml`)

| Layer | Result |
|-------|--------|
| Well-formed XML | PASS |
| Official XSD | PASS |
| Official Schematron/XSLT EN16931 | PASS |
| Mustang summary | `<summary status="valid"/>` / `XML:valid` |
| R74 / R008 | PASS |
| AE + `VATEX-EU-AE` + Steuerschuldnerschaft (structured, not note-only) | PASS |
| Arithmetic 599.00 / 0.00 / 599.00 / AE | PASS |

---

## 4. Adversarial interoperability battery

| Test | Result |
|------|--------|
| False-compliance (tamper GrandTotal → Mustang `status="invalid"`, copy deleted) | PASS |
| Required-field fail-closed | PASS |
| Unknown tax fail-closed | PASS |
| XML escaping (`& < > "`) | PASS |
| Source immutability / money invariants | PASS |
| Determinism (identical XML on double generate) | PASS |
| Adversarial money (net+vat≠gross) | PASS |
| Internal validator cross-check vs official | PASS (both VALID / valid) |
| Billing freeze recheck vs `99ee628` | PASS (no billing/Mollie/tax-engine/migration diffs) |
| Dependency audit | PASS (no `package.json` / lockfile changes) |

---

## 5. Regression

| Gate | Result |
|------|--------|
| `scripts/einvoice-additive.test.mjs` | 12/12 PASS |
| `npm run lint` | PASS (pre-existing unrelated unused-var warnings only; no einvoice errors) |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |

---

## 6. Billing freeze final recheck (all NO)

| Question | Answer |
|----------|--------|
| Billing files modified | NO |
| Tax engine modified | NO |
| Mollie modified | NO |
| Checkout modified | NO |
| Webhook modified | NO |
| Invoice issuance modified | NO |
| Numbering modified | NO |
| PDF renderer modified | NO |
| Invoice email modified | NO |
| Subscriptions modified | NO |
| Entitlements modified | NO |
| Migrations modified | NO |

---

## 7. Remaining notes / non-blockers

- PDF/A-3 hybrid: **NOT IMPLEMENTED** (future additive step; existing PDF renderer frozen).
- Operator must still approve before production wiring or customer delivery.
- XRechnung CIUS fields (BT-10, BG-16, seller contact, BT-23) are intentionally absent for Factur-X EN16931 B2B demos; add only if targeting XRechnung CIUS.
- Full FeRD ZIP was not downloaded via FeRD form (registration gate); evidence uses Mustang-embedded Factur-X **1.09.2** package dated **2026-08-04**.

---

## 8. Remediation commit

One local remediation commit after this report is written (message: `fix: certify ZUGFeRD 2.5.2 official validation`). **DO NOT PUSH. DO NOT DEPLOY.**
