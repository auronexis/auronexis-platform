# Proposal Generator — v1.0.2

**Routes:** `/sales/proposals`, `/sales/proposals/[id]`, `/sales/proposals/[id]/export`  
**Implementation:** `src/lib/sales/proposal-generator.ts`, `proposal-pdf.ts`

## Sections generated

- Pilot agreement
- Pricing proposal (founding discount applied)
- ROI estimate
- Timeline (6-week pilot)
- Implementation plan

## PDF export

GET `/sales/proposals/{id}/export` — downloads branded PDF via pdfkit.

## Create proposal

Lead detail → **Generate proposal**

Stores row in `sales_proposals` with MRR/ARR proposed values.

## Merge variables

Built from lead: company, contact, pain points, employee count, MRR estimates.
