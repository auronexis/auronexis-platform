# Integration Secrets Vault

Phase 4 Sprint 3 adds an encrypted credential store for enterprise integrations.

## Overview

Workflows and integration actions reference credentials by **`secretId` only**. Plaintext secrets are:

- Encrypted at rest in `integration_secrets.encrypted_value`
- Decrypted only on the server for future execution paths
- Never returned to the browser, diagnostics, logs, or simulation output

## Encryption model

| Component | Detail |
|-----------|--------|
| Algorithm | AES-256-GCM |
| Key env | `INTEGRATION_SECRET_KEY` |
| Key format | 64-char hex (32 bytes) or passphrase (scrypt-derived) |
| Stored payload | `iv:authTag:ciphertext` (base64 segments) |
| Masked preview | Stored in `metadata.masked_preview` at create/rotate time |

### Environment behavior

| Environment | Missing `INTEGRATION_SECRET_KEY` |
|-------------|----------------------------------|
| Development | Diagnostics warning; secret creation blocked with friendly error |
| Production | Secret creation blocked |

## Database

Table: `integration_secrets`

- Org-scoped with RLS
- Owner/Admin: SELECT, INSERT, UPDATE, DELETE
- Staff/Viewer: no access
- `service_role`: full access (server maintenance only)

## Secret types

- `bearer_token`
- `api_key`
- `basic_auth`
- `webhook_secret`
- `smtp_credentials`
- `oauth_placeholder` (no OAuth flow in Sprint 3)

## Lifecycle

1. **Create** — Owner/Admin submits plaintext once; stored encrypted; UI shows masked preview only
2. **Rotate** — Replace encrypted payload; update masked preview; optional `rotation_due_at`
3. **Delete** — Remove reference; workflows with `secretId` will fail validation until updated
4. **Mark used** — `last_used_at` updated on future server execution (not simulation)

## Masking rules

Display format: first 3 + `****` + last 4 characters (e.g. `sk_****x9A2`).

Applied to:

- Secret list UI
- Diagnostics (counts only, no values)
- Simulation request previews (`[secret:uuid]` placeholders)

## Repository API

Server-only module: `src/lib/integrations/secrets/`

- `createSecret()`
- `updateSecret()`
- `deleteSecret()`
- `rotateSecret()`
- `getSecretReference()` / `listSecretReferences()`
- `validateSecretAccess()`
- `markSecretUsed()`
- `getDecryptedSecretValue()` — never expose to UI

## UI

Route: `/automation/integrations/secrets`

- Owner/Admin only (redirects others to integrations catalog)
- Create, rotate, delete
- List shows masked preview, status, rotation due, last used

Integrations catalog links to the vault and shows per-provider credential counts.

## Workflow integration

Integration workflow actions should set:

```json
{
  "secretId": "uuid-of-vault-entry",
  "url": "https://..."
}
```

Simulation validates:

- `secretId` present → `secret reference: present|missing`
- No decrypted value in preview or execution log

## Diagnostics

Settings → Diagnostics → **Integration secrets**

- Table reachable
- Encryption key configured
- Secret counts, providers with credentials, expired/rotation due counts

## Future OAuth

`oauth_placeholder` reserves type and schema space. Real OAuth authorization, token refresh, and redirect flows arrive in a later sprint.

## Future live execution

Sprint 4+ will:

1. Resolve `secretId` via `getDecryptedSecretValue()`
2. Inject credentials into outbound requests server-side
3. Call `markSecretUsed()` after successful dispatch
4. Audit without logging plaintext

## Related

- [integrations.md](./integrations.md)
- [security.md](./security.md)
