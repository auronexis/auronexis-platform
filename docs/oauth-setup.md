# OAuth Setup Guide

**Version:** Auroranexis v0.96  
**Scope:** Enterprise connector OAuth for staging and production

---

## Environment variable pattern

Each connector uses `{PREFIX}_CLIENT_ID` and `{PREFIX}_CLIENT_SECRET`:

| Provider | Prefix | Env vars |
|----------|--------|----------|
| Google Workspace | `GOOGLE` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Microsoft 365 | `MICROSOFT` | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` |
| GitHub | `GITHUB` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| Slack | `SLACK` | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` |
| Microsoft Teams | `TEAMS` | `TEAMS_CLIENT_ID`, `TEAMS_CLIENT_SECRET` |
| Notion | `NOTION` | `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET` |
| HubSpot | `HUBSPOT` | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` |
| Jira | `JIRA` | `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET` |
| GitLab | `GITLAB` | `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET` |
| Zendesk | `ZENDESK` | `ZENDESK_CLIENT_ID`, `ZENDESK_CLIENT_SECRET` |
| Linear | `LINEAR` | `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET` |
| Salesforce | `SALESFORCE` | `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET` |
| ClickUp | `CLICKUP` | `CLICKUP_CLIENT_ID`, `CLICKUP_CLIENT_SECRET` |

---

## Redirect URI format

```
https://<APP_URL>/api/connectors/oauth/<connectorId>/callback
```

Examples (staging):

```
https://staging.auroranexis.com/api/connectors/oauth/google/callback
https://staging.auroranexis.com/api/connectors/oauth/microsoft/callback
https://staging.auroranexis.com/api/connectors/oauth/github/callback
```

---

## Provider setup notes

### Google Cloud Console

1. APIs & Services → Credentials → OAuth 2.0 Client
2. Authorized redirect URIs: staging + production callback URLs
3. Scopes: Gmail send, Calendar, Drive metadata (see `GOOGLE_CONNECTOR_CONFIG`)
4. PKCE enabled (app uses OAuth2 PKCE)

### Microsoft Azure / Entra ID

1. App registration → Authentication → Web redirect URIs
2. Supported account types: Multitenant or single tenant per pilot
3. Client secret with expiry calendar reminder
4. API permissions: `Mail.Send`, `Calendars.ReadWrite`, `Files.Read`, `User.Read`

### GitHub

1. Settings → Developer settings → OAuth Apps
2. Authorization callback URL: staging + production
3. Scopes: `repo`, `read:org`, `workflow`

### Slack

1. api.slack.com → Your Apps → OAuth & Permissions
2. Redirect URLs: staging + production callbacks
3. Bot scopes: `chat:write`, `channels:read`, `users:read`

### Notion, HubSpot, Jira, GitLab, Zendesk, Linear, Salesforce, ClickUp

Follow each provider's OAuth app creation flow. Register **both** staging and production redirect URIs before pilot testing.

---

## Supabase Auth (application login)

Separate from connector OAuth — configure in Supabase Dashboard:

| Setting | Staging | Production |
|---------|---------|------------|
| Site URL | `https://staging.auroranexis.com` | `https://app.auroranexis.com` |
| Redirect URLs | `/auth/callback` on same domain | `/auth/callback` |

Email/password auth is enabled by default. Enable Google/GitHub social providers in Supabase if desired (distinct from connector OAuth apps).

---

## Validation checklist

For each provider used in pilot:

- [ ] Client ID and secret set in Vercel (staging)
- [ ] Redirect URI registered in provider console
- [ ] Connect flow: Automation → Connectors → Connect
- [ ] Callback completes without error
- [ ] Token stored (Diagnostics → Enterprise Connectors shows connected + valid token)
- [ ] Disconnect revokes connection
- [ ] Sync job enqueues (Diagnostics → Queue)

Verify in **Settings → Diagnostics → Enterprise Connectors** — `oauthConfigured` and `tokenValid` per provider.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `redirect_uri_mismatch` | Callback URL not registered in provider |
| `OAuth client ID not configured` | Missing `{PREFIX}_CLIENT_ID` in Vercel |
| Token invalid immediately | Clock skew or wrong client secret |
| Connect works locally but not staging | `NEXT_PUBLIC_APP_URL` mismatch |

---

## Related

- [domain-setup.md](./domain-setup.md)
- [connectors.md](./connectors.md)
- [deployment-staging.md](./deployment-staging.md)
