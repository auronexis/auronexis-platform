# Lead Sourcing Top 100 — v1.0.2

**Target:** 100 qualified agencies  
**Implementation:** `src/lib/sales/lead-sourcing.ts`

## Regions

| Key | Label |
|-----|-------|
| `germany` | Germany |
| `dach` | DACH |
| `eu` | EU |

## Agency types

| Key | Label |
|-----|-------|
| `msp` | MSP |
| `ai_agency` | AI Agency |
| `automation_agency` | Automation Agency |
| `agency` | Agency |
| `consultant` | Consultant |

## CRM fields

- `source_region` on `sales_leads`
- `agency_type` on `sales_leads`

## Qualification criteria

See `TOP_100_AGENCY_CRITERIA` in code — ICP fit, decision-maker, enrichment complete.

## In-app

`/sales/sourcing` — filter by region and agency type.
