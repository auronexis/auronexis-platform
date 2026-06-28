# Release Notes — v0.1.0 RC

**Release Candidate** — production readiness sprint. No new features; stability, polish, and documentation.

## Highlights

- Unified AI core layer with shared error handling, validation, and observability
- Shared AI UI components across all copilot modules
- Knowledge Hub integrated into report/operational context and dashboard
- Extended workspace diagnostics including platform and AI health
- Root documentation for architecture, deployment, security, database, AI, and testing

## RC sprint fixes

### Bugs fixed

- **Hydration mismatch** — Dashboard time-based greeting moved to client component (`CommandCenterGreeting`)
- **Incorrect upgrade titles** — AI upgrade cards now show module-appropriate titles (Report, Operational, Knowledge, Client Success, Automation)
- **Accessibility** — Confirm dialog consequences included in `aria-describedby`
- **Accessibility** — Send report email dialog improved ARIA labeling
- **Accessibility** — Automation center upgrade card keyboard/ARIA improvements
- **Code quality** — Removed duplicate `import "server-only"` in OpenAI provider
- **Diagnostics** — Fixed `planSource` reference in platform diagnostics query

### Observability

- New **Platform health** section in Settings → Diagnostics:
  - Build version, environment, deployment URL
  - Database connectivity and latency
  - Stripe configuration status
  - React cache status, plan source, developer mode

### Documentation

New root guides:

- `docs/architecture.md`
- `docs/deployment.md`
- `docs/security.md`
- `docs/database.md`
- `docs/ai.md`
- `docs/testing.md`
- `docs/release-notes.md`

Plus existing `docs/ai/*` developer references from Sprint 9.

## Known limitations (technical debt)

- Some settings/create pages retain legacy slate styling vs full Aurora tokens
- Global search listbox pattern could be improved for strict ARIA compliance
- Deprecated client-side assistant path may remain for backward compatibility
- Detail pages not yet uniformly migrated to `DetailPageHeader`

These items do not block RC launch but are tracked for post-launch polish.

## Upgrade notes

No database breaking migrations in this release. Apply any pending Supabase migrations before deploy.

Ensure all environment variables from `.env.example` are set in production.

## Validation

Release gate:

```bash
npm run lint && npm run typecheck && npm run build
```

See [testing.md](./testing.md) for full QA checklist.
