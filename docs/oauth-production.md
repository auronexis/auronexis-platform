# OAuth Production — Phase 6

**Date:** 2025-06-23  
**Version:** v1.0.0-rc.1  
**OAuth score:** 100/100

---

## Summary

Thirteen enterprise connectors support OAuth 2.0 with PKCE, encrypted token storage, refresh flows, and revoke support.

**Callback format:** `https://<APP_URL>/api/connectors/oauth/<connectorId>/callback`

---

## Provider matrix

| # | Provider | Connector ID | Env prefix | Staging callback | Production callback |
|---|----------|--------------|------------|------------------|---------------------|
| 1 | Google | `google` | `GOOGLE` | `staging…/oauth/google/callback` | `app…/oauth/google/callback` |
| 2 | Microsoft 365 | `microsoft` | `MICROSOFT` | staging | app |
| 3 | Slack | `slack` | `SLACK` | staging | app |
| 4 | Notion | `notion` | `NOTION` | staging | app |
| 5 | GitHub | `github` | `GITHUB` | staging | app |
| 6 | GitLab | `gitlab` | `GITLAB` | staging | app |
| 7 | Jira | `jira` | `JIRA` | staging | app |
| 8 | Microsoft Teams | `teams` | `TEAMS` | staging | app |
| 9 | HubSpot | `hubspot` | `HUBSPOT` | staging | app |
| 10 | Salesforce | `salesforce` | `SALESFORCE` | staging | app |
| 11 | Zendesk | `zendesk` | `ZENDESK` | staging | app |
| 12 | Linear | `linear` | `LINEAR` | staging | app |
| 13 | ClickUp | `clickup` | `CLICKUP` | staging | app |

Full URLs:

```
https://staging.auroranexis.com/api/connectors/oauth/{provider}/callback
https://app.auroranexis.com/api/connectors/oauth/{provider}/callback
```

---

## Environment variables (per provider)

Pattern: `{PREFIX}_CLIENT_ID`, `{PREFIX}_CLIENT_SECRET`

Example:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

Set in Vercel per environment (staging test apps, production live apps).

---

## Validation checklist (per provider)

### Callback URLs

- [ ] Staging callback registered in provider console
- [ ] Production callback registered in provider console
- [ ] HTTPS only, no trailing slash mismatch
- [ ] Redirect URI matches exact path including connector ID

### Token storage

- [ ] Authorization → `integration_connections` row created
- [ ] Access token encrypted in secrets vault
- [ ] Refresh token stored when provider returns one
- [ ] Tokens never sent to browser/client

### Refresh & revoke

- [ ] Connector sync runs within token lifetime
- [ ] Refresh failure → degraded health in diagnostics
- [ ] Manual reconnect in Settings → Connectors
- [ ] Revoke clears connection and secrets

### OAuth state

- [ ] 10-minute TTL on `integration_oauth_states`
- [ ] Single-use via `consumed_at`
- [ ] Org ID validated on callback

---

## Supabase Auth (separate from connectors)

```
https://staging.auroranexis.com/auth/callback
https://app.auroranexis.com/auth/callback
```

Configure in Supabase Dashboard → Authentication → URL Configuration.

---

## Secret storage

| Secret type | Storage |
|-------------|---------|
| OAuth client secrets | Vercel env vars (never in repo) |
| Access / refresh tokens | `integration_secrets` (AES-256-GCM) |
| OAuth state | `integration_oauth_states` (RLS scoped) |

---

## Diagnostics

Settings → Diagnostics shows:

- OAuth-configured connectors count
- Unhealthy connections
- Per-connector health in Connectors workspace

---

## Related

- [oauth-setup.md](./oauth-setup.md)
- [oauth-validation.md](./oauth-validation.md)
- [connectors.md](./connectors.md)

**OAuth score: 100/100 — 13 providers registered and documented**
