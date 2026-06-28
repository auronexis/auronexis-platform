# OAuth Validation Report

**Date:** 2025-06-23  
**Version:** v0.99.0  
**Environments:** Staging + Production callback URLs

---

## Summary

Thirteen enterprise connectors support OAuth 2.0 with PKCE. Each uses encrypted token storage and standard revoke flows.

**Setup guide:** [oauth-setup.md](./oauth-setup.md)  
**Callback format:** `https://<APP_URL>/api/connectors/oauth/<connectorId>/callback`

---

## Provider matrix

| # | Provider | Connector ID | Env prefix | Callback (staging) |
|---|----------|--------------|------------|-------------------|
| 1 | Google | `google` | `GOOGLE` | `…/oauth/google/callback` |
| 2 | Microsoft 365 | `microsoft` | `MICROSOFT` | `…/oauth/microsoft/callback` |
| 3 | Slack | `slack` | `SLACK` | `…/oauth/slack/callback` |
| 4 | Notion | `notion` | `NOTION` | `…/oauth/notion/callback` |
| 5 | GitHub | `github` | `GITHUB` | `…/oauth/github/callback` |
| 6 | GitLab | `gitlab` | `GITLAB` | `…/oauth/gitlab/callback` |
| 7 | Jira | `jira` | `JIRA` | `…/oauth/jira/callback` |
| 8 | Microsoft Teams | `teams` | `TEAMS` | `…/oauth/teams/callback` |
| 9 | HubSpot | `hubspot` | `HUBSPOT` | `…/oauth/hubspot/callback` |
| 10 | Salesforce | `salesforce` | `SALESFORCE` | `…/oauth/salesforce/callback` |
| 11 | Zendesk | `zendesk` | `ZENDESK` | `…/oauth/zendesk/callback` |
| 12 | Linear | `linear` | `LINEAR` | `…/oauth/linear/callback` |
| 13 | ClickUp | `clickup` | `CLICKUP` | `…/oauth/clickup/callback` |

Register **both** staging and production redirect URIs in each provider console before pilot testing.

---

## Validation checklist (per provider)

### Callback URLs

- [ ] Staging callback registered in provider console
- [ ] Production callback registered in provider console
- [ ] No trailing slash mismatch
- [ ] HTTPS only

### Token storage

- [ ] Authorization completes → `integration_connections` row created
- [ ] Access token encrypted (integration secrets vault)
- [ ] Refresh token stored when provider returns one
- [ ] Token never exposed to client/browser

### Refresh tokens

- [ ] Connector sync runs without re-auth within token lifetime
- [ ] Refresh failure surfaces degraded health in diagnostics
- [ ] Manual reconnect available in Settings → Connectors

### Revoke flow

- [ ] Disconnect removes connection row
- [ ] Provider revoke called where supported
- [ ] Secrets cleared from vault

---

## Staging test procedure

1. Set `{PREFIX}_CLIENT_ID` and `{PREFIX}_CLIENT_SECRET` in Vercel staging env
2. Login as demo org owner
3. Settings → Connectors → Connect → complete OAuth
4. Verify health badge = healthy
5. Disconnect → verify row removed
6. Repeat for each pilot-required connector

**Pilot minimum (recommended):** Google, Slack, GitHub — covers email, chat, and dev workflows.

---

## Supabase Auth (application login)

Separate from connector OAuth:

| Provider | Staging callback |
|----------|------------------|
| Email/password | Native Supabase |
| Google (optional) | Supabase Auth → Redirect URLs |

Configure in Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://staging.auroranexis.com`
- Redirect URLs: staging + production app URLs

---

## Known gaps

| Item | Severity | Notes |
|------|----------|-------|
| Unconfigured providers | Expected | Diagnostics shows OAuth readiness 70 until first connector configured |
| Teams uses Microsoft Graph | Info | Separate app registration from Microsoft 365 if needed |

---

## Related

- [connectors-staging-validation.md](./connectors-staging-validation.md)
- [staging-validation.md](./staging-validation.md)
- [.env.example](../.env.example)
