# Customer Success — v1.0.1

**Route:** `/sales/success`

## Pilot onboarding checklist (8 milestones)

1. Workspace provisioned
2. Admin users invited
3. First client imported
4. Risk register configured
5. Incident workflow tested
6. First report generated
7. Portal access enabled
8. Kickoff feedback captured

## Scores (0–100)

| Score | Meaning |
|-------|---------|
| Adoption | Milestone progress |
| Usage | Activity after onboarding |
| Success | Composite health |
| Risk | Inverse of success |
| Renewal probability | Weighted renewal forecast |

Scores computed in `src/lib/sales/customer-success.ts` and stored in `customer_success_records`.

## Milestones → founding conversion

- **Week 1–2:** Milestones 1–4
- **Week 3–4:** Milestones 5–7
- **Week 5–6:** Milestone 8 + renewal review

## Risk triggers

- Adoption &lt; 40 after week 2
- Usage flat for 14 days
- No kickoff feedback by week 4

## Actions

1. Update milestones in `/sales/success`.
2. Escalate at-risk accounts to founder call.
3. Capture case study at milestone 8 for marketing.
