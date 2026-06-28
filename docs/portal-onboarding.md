# Portal Onboarding — v1.0.2

**Route:** `/client-portal/onboarding`

## Customer-facing features

- Onboarding status
- Milestones (6 steps)
- Open tasks count
- Reports link (existing module)
- Feedback form with satisfaction score

## Milestones

1. Account provisioned
2. Kickoff complete
3. First deliverable
4. Integrations live
5. Reports available
6. Feedback submitted

## Database

Table: `portal_customer_onboarding`  
Linked by `client_id` and `organization_id`.

## Feedback action

`submitPortalOnboardingFeedback` in `src/lib/client-portal/actions.ts`
