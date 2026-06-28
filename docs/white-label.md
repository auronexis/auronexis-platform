# White Label Platform

Phase 4 Sprint 7 introduces a fully brandable enterprise SaaS layer. MSPs, IT providers, agencies, and enterprise customers can rebrand the dashboard, login, client portal, emails, and PDF exports without modifying application code.

This sprint adds white-label infrastructure only. It does not change RBAC, authentication, Stripe, AI modules, the Automation Engine, Public API, Workflow Engine, or core business logic.

## Architecture

```
white_label_settings (PostgreSQL)
        ↓
white-label-assets (Supabase Storage, org-scoped paths)
        ↓
src/lib/white-label/ (queries, branding, themes, assets, actions)
        ↓
resolveWhiteLabelBranding() → ResolvedWhiteLabelBranding
        ↓
toLegacyResolvedBranding() → branding/queries.ts → existing consumers
        ↓
WhiteLabelThemeInjector (runtime CSS variables, no rebuild)
```

### Module layout

| File | Purpose |
|------|---------|
| `types.ts` | Settings view, resolved branding, diagnostics, asset types |
| `queries.ts` | Load settings, resolve branding, diagnostics, hostname lookup |
| `actions.ts` | Save, publish, reset, asset upload server actions |
| `branding.ts` | Merge settings + legacy `organization_branding`, resolve assets |
| `themes.ts` | Aurora UI token generation (`--brand-primary`, etc.) |
| `assets.ts` | Upload validation, signed URLs, storage paths |
| `portal.ts` / `email.ts` / `pdf.ts` | Surface-specific branding context |
| `domains.ts` | Custom domain validation and placeholder DNS/SSL status |
| `validation.ts` | Hex, URL, email, domain validation; CSS sanitization |
| `cache.ts` | 60s in-memory cache per organization (draft vs published) |
| `preview.ts` | Live preview viewport helpers |

### Plan gate

White label requires the `white_label` feature (Professional plan and above). Organizations without the feature receive platform defaults via `getPlatformBrandingFallback()`.

### Publish flow

1. **Save** — Owner/admin edits draft settings at `/settings/branding`. Changes persist to `white_label_settings` and sync legacy `organization_branding` for backward compatibility.
2. **Publish** — Sets `published_at`. Live surfaces (dashboard, portal, email, PDF) use published branding only.
3. **Reset** — Clears white-label settings and restores platform defaults.

Draft preview in the settings workspace uses unpublished values. Production routes call `getBrandingFromWhiteLabel()` with `publishedOnly: true`.

## Database

Migration: `supabase/migrations/20250624110000_white_label_platform.sql`

### Table: `white_label_settings`

One row per organization (`organization_id` unique). Key columns:

- **Identity:** `company_name`, `platform_name`
- **Assets:** `logo_light`, `logo_dark`, `favicon`, `login_background`, `dashboard_background`
- **Theme:** `primary_color`, `secondary_color`, `accent_color`, `success_color`, `warning_color`, `danger_color`, `custom_css`
- **Support:** `support_email`, `support_url`, `website`, `privacy_url`, `terms_url`
- **Portal:** `portal_title`, `portal_description`, `portal_welcome_message`
- **Login:** `login_title`, `login_subtitle`, `login_welcome_message`
- **Email:** `email_sender_name`, `email_sender_address`
- **PDF:** `pdf_footer`
- **Domain:** `custom_domain`, `domain_verification_status`, `domain_ssl_status`, `domain_verified_at`
- **Lifecycle:** `published_at`, `updated_by`, `created_at`, `updated_at`

### RLS

- **SELECT** — authenticated users in the same organization
- **INSERT / UPDATE** — owner and admin only

### Indexes

- `idx_white_label_settings_organization_id`
- `idx_white_label_settings_custom_domain` (partial, where `custom_domain IS NOT NULL`)

### Storage bucket: `white-label-assets`

Private bucket, 2 MB limit, PNG/JPEG/WEBP/SVG/ICO. Paths: `{organization_id}/{asset_kind}/{filename}`. RLS restricts access to the owning organization; owner/admin for writes.

## Theme engine

`buildThemeTokens()` generates Aurora-compatible tokens:

| Token | CSS variable |
|-------|----------------|
| Primary | `--brand-primary` |
| Secondary | `--brand-secondary` |
| Accent | `--brand-accent` |
| Surface | `--brand-surface` |
| Background | `--brand-background` |
| Border | `--brand-border` |
| Text | `--brand-text` |
| Muted | `--brand-muted` |
| Success | `--brand-success` |
| Warning | `--brand-warning` |
| Danger | `--brand-danger` |

`WhiteLabelThemeInjector` injects variables at runtime on `#dashboard-root`, `#portal-root`, and login scopes. Theme changes apply immediately without rebuilding the application.

Custom CSS is sanitized in `validation.ts`: scripts, `@import`, `expression()`, and HTML injection patterns are rejected.

## Brand assets

Asset kinds: logo light, logo dark, favicon, login background, dashboard background.

- **Formats:** PNG, SVG, ICO, WEBP (JPEG accepted)
- **Max size:** 2 MB
- **Validation:** MIME type, dimensions (where applicable), file size
- **Delivery:** Signed URLs only; internal storage paths are never exposed

Resolved branding exposes:

- `logoUrl` / `logoLightUrl` / `logoDarkUrl` — dashboard, portal, email, PDF
- `faviconUrl` — favicon
- `loginBackgroundUrl` / `dashboardBackgroundUrl` — surface backgrounds

## Surfaces

### Dashboard

`src/app/(dashboard)/layout.tsx` wraps content in `#dashboard-root` with `WhiteLabelThemeInjector`. `DashboardShell` and `BrandLogo` consume `getOrganizationBranding()`.

### Login

`LoginBrandingShell` renders title, subtitle, logo, background, and support links. Staff login at `/login` and portal login at `/client-portal/login` resolve branding by custom domain hostname when a published `custom_domain` matches; otherwise platform defaults apply.

### Client portal

Portal layout injects theme variables. `PortalFooter` hides Auroranexis “Powered by” when `hidePlatformBranding` is true (published white label) and shows support contact instead.

### Email

Report emails use `getPoweredByLine()` from branding. Published white label replaces “Powered by Auroranexis” with the organization footer or company name.

### PDF

Report PDF footers use the same `getPoweredByLine()` helper. Watermarks use the company name.

## Custom domains

Architecture only in v1. `domains.ts` validates domain format and returns placeholder verification/SSL status (`pending`). No live DNS provisioning or SSL issuance.

When a published `custom_domain` matches the request hostname, login pages load that organization’s published branding via `getPublishedBrandingByHostname()`.

## Settings UI

Route: `/settings/branding` (Professional+ plan, owner/admin)

Sections: General, Brand, Theme, Portal, Emails, PDF, Domain, Preview, Save, Publish, Reset.

Live preview supports desktop/tablet/mobile viewports and dashboard, login, portal, PDF, and email surfaces.

## Diagnostics

Settings → Diagnostics includes a **White Label** section:

- Brand, theme, portal, email, PDF, domain, and asset configuration flags
- Cache status and published state
- Link to `/settings/branding` when the feature is enabled

## Security

- Owner/admin only for settings CRUD and asset uploads
- Upload MIME and size validation
- Custom CSS sanitization (no scripts, no `@import`)
- Organization-scoped storage RLS
- Signed asset URLs; no internal path exposure
- Multi-tenancy preserved via `organization_id` on all rows and storage paths

## Future roadmap

- Live custom domain DNS verification and SSL provisioning
- Additional asset kinds (email logo, PDF logo, avatar placeholder)
- Per-surface theme overrides
- White-label automation and notification email templates
- CDN-backed public asset delivery for custom domains
- Theme preset library and import/export

## Related files

- Settings workspace: `src/components/settings/white-label-workspace.tsx`
- Theme injector: `src/components/white-label/white-label-theme-injector.tsx`
- Login shell: `src/components/branding/login-branding-shell.tsx`
- Legacy bridge: `src/lib/branding/queries.ts`
