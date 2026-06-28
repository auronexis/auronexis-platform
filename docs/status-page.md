# Status Page — Auroranexis v0.975

---

## In-app status

**Route:** `/status`

Displays component health:

- Platform, API, Connectors, AI, Billing
- Cron, Queue, Integrations, Webhooks

Status levels: Operational, Degraded, Maintenance, Unknown

Data sourced from existing health checks (database, cron, queue, Stripe webhooks).

---

## External status (planned)

**URL:** https://status.auroranexis.com

Configure Better Stack, Instatus, or Statuspage to mirror `/api/health` and manual incident posts.

---

## Related

- `GET /api/health` — machine-readable probe
- Dashboard Platform status widget (owner/admin)
