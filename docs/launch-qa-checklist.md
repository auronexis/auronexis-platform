# Auroranexis Launch QA Checklist

Production hardening checklist for Phase 13. Use before every launch candidate.

## Route smoke test

### Public routes
- [ ] `/` — landing loads, no console errors
- [ ] `/about`, `/security`, `/status`, `/privacy`, `/terms`, `/cookies`, `/imprint`
- [ ] `/data-processing-agreement`, `/security-policy`, `/subprocessors`, `/acceptable-use`
- [ ] `/docs/api` — public API docs render

### Auth routes
- [ ] `/login` — sign in works, invalid credentials show inline error
- [ ] `/signup` — validation errors inline, success redirects
- [ ] `/forgot-password`, `/reset-password` — no crash on invalid token

### Dashboard routes
- [ ] `/dashboard` — intelligence widgets load, skeletons match layout
- [ ] `/clients`, `/clients/new`, `/clients/[id]` — CRUD, archive, SLA section
- [ ] `/reports`, `/reports/new`, `/reports/[id]` — create, generate, publish
- [ ] `/risks`, `/risks/new`, `/risks/[id]`
- [ ] `/incidents`, `/incidents/new`, `/incidents/[id]` — resolve, archive
- [ ] `/knowledge`, `/automation`, `/monitoring`, `/profitability`, `/sales`
- [ ] `/activity`, `/notifications`

### Settings routes
- [ ] `/settings`, `/settings/team`, `/settings/plans`, `/settings/billing`
- [ ] `/settings/billing/diagnostics`, `/settings/usage`, `/settings/sla`

## Billing checklist

- [ ] Plans page shows current plan and upgrade options
- [ ] Checkout opens Stripe (Owner/Admin only)
- [ ] Non-admin billing actions show permission message (no global error)
- [ ] Customer portal opens successfully
- [ ] Promo code validation shows success/error toast
- [ ] Webhook endpoint returns 400 without signature (not 500)
- [ ] No webhook secret prefixes in server logs

## Feature-gate checklist

Verify restricted plans show upgrade CTA or disabled state — never POST 500 or global error:

| Feature | Gate location | Required plan |
|---------|---------------|---------------|
| SLA tracking | `/settings/sla`, client SLA assignment | Business |
| Profitability | `/profitability`, financial forms | Professional+ |
| Escalation rules | `/settings/escalation` | Business |
| Report templates | `/reports/templates` | Professional+ |
| Report scheduling | `/reports/schedules` | Business |
| White label / branding | Settings branding | Enterprise |
| Notifications | `/notifications` mark read | Starter+ |
| Incidents | Incident forms | Per plan matrix |
| AI predictive | Dashboard intelligence refresh | Business |

## Error handling checklist

- [ ] Form actions return `{ error }` — never throw `AuthorizationError` to global error boundary
- [ ] Plan restrictions return upgrade message inline
- [ ] Validation errors show on form fields / FormAlert
- [ ] Confirm buttons (archive, delete) show toast on failure
- [ ] No stack traces in UI
- [ ] No raw Supabase/Postgres errors in customer-facing copy

## Toast / feedback checklist

- [ ] Client created / updated / archived / deleted
- [ ] Report created / published / archived
- [ ] Risk / incident created / updated / resolved
- [ ] SLA policy saved, client SLA assignment saved
- [ ] Team invite sent
- [ ] Financials saved (profitability table)
- [ ] Billing portal / checkout errors show human-readable toast
- [ ] Mark all notifications read shows success toast

## Loading / skeleton checklist

- [ ] Dashboard loads without white flash
- [ ] Detail pages (`/clients/[id]`, `/reports/[id]`) show skeletons matching final layout
- [ ] Settings pages load gracefully
- [ ] No layout shift on table hydration

## Empty state checklist

Each list page shows icon, title, description, and CTA where appropriate:

- [ ] Dashboard intelligence (no clients / no data)
- [ ] Clients, reports, risks, incidents
- [ ] Knowledge, automation, monitoring
- [ ] Profitability, sales, activity, notifications
- [ ] Team, billing diagnostics

## Mobile / responsive checklist

Test at 360px, 768px, 1024px, 1366px, 1440px:

- [ ] No horizontal overflow on dashboard or client detail
- [ ] Sidebar collapses / behaves correctly
- [ ] Tables scroll horizontally inside container
- [ ] Dashboard intelligence cards stack on mobile
- [ ] Pricing cards usable on small screens
- [ ] Sticky client section nav does not overlap content

## Accessibility checklist

- [ ] Icon-only buttons have `aria-label`
- [ ] Focus rings visible on interactive elements
- [ ] Modals close with ESC
- [ ] Disabled buttons have visible explanation or nearby text
- [ ] Color contrast meets WCAG AA on primary actions

## Security checklist

- [ ] No `console.log` debug output in production paths
- [ ] No webhook secret prefixes in logs
- [ ] No `service_role` or live Stripe keys in client bundle
- [ ] Diagnostics pages mask Stripe IDs
- [ ] Server logs use sanitized operational messages only

## Hydration checklist

- [ ] No React hydration warnings in browser console
- [ ] Aurora tables: no whitespace text nodes in `<tbody>` / `<tr>`
- [ ] Profitability table: no Fragment inside tbody
- [ ] No buttons inside links or links inside buttons

## Performance sanity check

- [ ] Dashboard intelligence does not duplicate heavy queries unnecessarily
- [ ] No obvious N+1 on list pages
- [ ] Build completes without bundle warnings for new deps

## Validation commands

```bash
npm run lint
npm run typecheck
npm run build
```

All three must pass before deploy.

## Manual browser console check

After build, smoke test and confirm console is clean on:

- `/dashboard`
- `/clients/[id]`
- `/settings/plans`
- `/settings/billing`
- `/login`

Look for: hydration warnings, React errors, 500 responses, failed fetches.

## Known non-blocking issues

Document any deferred items here (no secrets):

- Staff-only status restrictions rely on server validation; UI may still show all options on some legacy forms.
- Void server actions (archive, redirect flows) surface errors via toast, not inline form state.

---

Last updated: Phase 13 production hardening.
