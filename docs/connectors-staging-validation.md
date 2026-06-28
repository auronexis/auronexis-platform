# Connector Staging Validation

**Version:** Auroranexis v0.96  
**Environment:** `staging.auroranexis.com`

---

## Providers to validate

| Provider | Connector ID | OAuth prefix |
|----------|--------------|--------------|
| Google Workspace | `google` | `GOOGLE` |
| Microsoft 365 | `microsoft` | `MICROSOFT` |
| GitHub | `github` | `GITHUB` |
| Slack | `slack` | `SLACK` |
| Microsoft Teams | `teams` | `TEAMS` |
| Notion | `notion` | `NOTION` |
| HubSpot | `hubspot` | `HUBSPOT` |
| Jira | `jira` | `JIRA` |
| GitLab | `gitlab` | `GITLAB` |
| Zendesk | `zendesk` | `ZENDESK` |
| Linear | `linear` | `LINEAR` |
| Salesforce | `salesforce` | `SALESFORCE` |
| ClickUp | `clickup` | `CLICKUP` |

---

## Per-provider test matrix

| Step | Pass criteria |
|------|---------------|
| OAuth configured | Diagnostics shows `oauthConfigured: Yes` |
| Authorize | Redirect to provider consent screen |
| Callback | Returns to app without error |
| Connected | Diagnostics shows `connected` + valid token |
| Refresh | Token refresh succeeds (wait until near expiry or force via sync) |
| Sync | Manual sync or cron enqueues `connector_sync` queue job |
| Health | Diagnostics health status `healthy` |
| Disconnect | Revoke removes connection; token cleared |

---

## Validation procedure

1. Sign in as owner on staging
2. Navigate to **Automation → Connectors**
3. For each pilot-required provider:
   - Click **Connect**
   - Complete OAuth consent
   - Verify connection status
   - Run **Sync now** (if available)
   - Click **Disconnect**
4. Review **Settings → Diagnostics → Enterprise Connectors**

---

## Diagnostics fields

| Field | Healthy value |
|-------|---------------|
| Registered connectors | 13 |
| OAuth configured | Matches env vars set |
| Valid tokens | = connected providers |
| Expired tokens | 0 |
| Refresh failures | 0 |
| Unhealthy connections | 0 |

---

## Known limitations

- Inbound connector webhooks use stub validators (documented in security audit)
- Full sync execution depends on queue worker processing
- Providers without env vars show `oauthConfigured: No` — expected until configured

---

## Pilot minimum

For first 3 pilot customers, validate at minimum:

- [ ] Google **or** Microsoft (workspace)
- [ ] GitHub **or** GitLab (devops)
- [ ] Slack **or** Teams (messaging)

---

## Related

- [oauth-setup.md](./oauth-setup.md)
- [connectors.md](./connectors.md)
