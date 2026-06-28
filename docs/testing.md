# Testing Guide

Validation and QA procedures for Auroranexis Release Candidate.

## Automated checks

Run before every release:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

| Script | Purpose |
|--------|---------|
| `npm run lint` | ESLint (Next.js config) |
| `npm run typecheck` | TypeScript `tsc --noEmit` |
| `npm run build` | Production Next.js build |
| `npm run test:e2e` | Playwright E2E (see [e2e-results.md](./e2e-results.md)) |
| `npm run test:e2e:ui` | Playwright interactive UI mode |

All three must pass for RC sign-off.

## Manual QA checklist

### Authentication & session

- [ ] Sign up / login / logout
- [ ] Session persists across refresh
- [ ] Unauthorized routes redirect to login

### Core CRUD

- [ ] Clients — create, edit, list, detail
- [ ] Risks — create, edit, link to client
- [ ] Incidents — create, edit, status updates
- [ ] Reports — create, edit, PDF export

### Billing

- [ ] Checkout flow (test mode)
- [ ] Customer portal link
- [ ] Plan features unlock after subscription

### AI (plan permitting)

- [ ] Report copilot — generate, cancel, error display
- [ ] Operational assistant
- [ ] Knowledge hub search
- [ ] Upgrade card on locked plans

### Settings

- [ ] Profile, timezone, notifications
- [ ] Team / roles (RBAC)
- [ ] Diagnostics page (owner/admin)

### Client portal

- [ ] Portal login and scoped client view

### Themes

- [ ] Light / dark mode
- [ ] Theme persistence

## Responsive breakpoints

Verify no horizontal overflow or clipped dialogs at:

- 320px, 375px, 390px (mobile)
- 768px (tablet)
- 1024px, 1280px, 1536px (desktop)

## Accessibility smoke test

- Tab through primary flows — logical focus order
- Dialogs: ESC closes, focus trapped
- Form inputs have labels
- Icon-only buttons have `aria-label`

## Performance smoke test

- Dashboard loads without layout shift
- Large lists paginate or virtualize
- AI panels show loading state before content

## Environment matrix

| Environment | Supabase | Stripe | AI |
|-------------|----------|--------|-----|
| Local | Dev project | Test keys | Optional key |
| Preview | Staging | Test keys | Optional key |
| Production | Prod project | Live keys | Required for AI |

## Regression focus (RC sprint)

Areas hardened in RC:

- Hydration-safe dashboard greeting
- Consistent AI upgrade card titles
- Confirm dialog `aria-describedby` for consequences
- Send report email dialog ARIA
- Platform diagnostics (build, DB, Stripe health)

## Related

- [deployment.md](./deployment.md)
- [release-notes.md](./release-notes.md)
