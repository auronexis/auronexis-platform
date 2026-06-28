# Lead Scoring — v1.0.1

**Implementation:** `src/lib/sales/enrichment.ts`

## Enrichment fields

| Field | Source |
|-------|--------|
| Website | Manual / enrichment |
| LinkedIn | Manual / Sales Nav |
| Employees | `employee_count` |
| Location | Manual |
| Industry | Manual |
| ARR estimate | `potential_mrr × 12` |
| Potential MRR | Explicit or size-based default |
| Pain score | Pain point depth heuristic |
| Fit score | Profile completeness + ICP signals |
| Priority score | Weighted composite |

## Scoring model

```
pain_score   = f(pain_points length, profile gaps)
fit_score    = f(website, linkedin, industry, employees, location)
priority     = pain × 0.35 + fit × 0.45 + revenue_weight
```

Revenue weight: +20 if MRR ≥ $499, +12 if ≥ $299, else +5.

## Default MRR by size

| Employees | Default MRR |
|-----------|-------------|
| 200+ | $799 |
| 50–199 | $499 |
| 10–49 | $299 |
| &lt; 10 | $149 |

## Usage

1. Save lead in `/sales/leads/[id]` — scores auto-compute.
2. Sort outbound lists by `priority_score` DESC.
3. Focus daily outreach on priority ≥ 70.

## Database columns

`pain_score`, `fit_score`, `priority_score`, `potential_mrr`, `arr_estimate` on `sales_leads`.
