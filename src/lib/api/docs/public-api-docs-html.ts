import { API_BASE_PATH } from "@/lib/api/versioning/constants";
import { COMPANY_NAME, SUPPORT_EMAIL } from "@/lib/company/contact";
import type { MarketingAuthState } from "@/lib/marketing/auth-context";
import { resolvePublicAppShortcut } from "@/lib/marketing/auth-context";
import {
  buildStandalonePublicHeaderHtml,
  STANDALONE_PUBLIC_HEADER_STYLES,
} from "@/lib/marketing/public-header-html";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/types";

const FEATURED_SCOPES = [
  "clients.read",
  "health.read",
  "risks.read",
  "incidents.read",
  "reports.read",
  "activity.read",
  "webhooks.write",
] as const;

const FEATURED_ENDPOINTS = [
  "GET /api/v1/me",
  "GET /api/v1/activity",
  "GET /api/v1/clients",
  "GET /api/v1/clients/{id}",
  "GET /api/v1/clients/{id}/health",
  "GET /api/v1/clients/{id}/risks",
  "GET /api/v1/clients/{id}/incidents",
  "GET /api/v1/reports",
  "GET /api/v1/reports/{id}",
] as const;

/** Self-contained dark HTML for /api/docs — no client JS or external CSS required. */
export function buildPublicApiDocsHtml(auth: MarketingAuthState): string {
  const year = new Date().getFullYear();
  const appShortcut = resolvePublicAppShortcut(auth);

  const scopeRows = FEATURED_SCOPES.map(
    (scope) => `<tr><td><code>${scope}</code></td></tr>`,
  ).join("");

  const endpointRows = FEATURED_ENDPOINTS.map(
    (endpoint) => `<tr><td><code>${endpoint}</code></td></tr>`,
  ).join("");

  const webhookTags = WEBHOOK_EVENTS.map(
    (event) => `<code class="tag">${event}</code>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Auroranexis API</title>
  <meta name="description" content="Auroranexis REST API reference — authentication, scopes, endpoints, webhooks, and rate limits." />
  <style>
    :root {
      color-scheme: dark;
      --bg: #0a1628;
      --surface: #0f2140;
      --surface-2: #152d52;
      --border: #1e3a5f;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --primary: #3b82f6;
      --primary-hover: #60a5fa;
      --code-bg: #0c1929;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--primary); text-decoration: none; }
    a:hover { color: var(--primary-hover); text-decoration: underline; }
    .wrap { max-width: 56rem; margin: 0 auto; padding: 0 1.5rem; }
    ${STANDALONE_PUBLIC_HEADER_STYLES}
    .page-hero {
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%);
      padding: 1.5rem 0 1.75rem;
    }
    .eyebrow {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 0.5rem;
    }
    h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: 0.75rem 0 0;
      max-width: 42rem;
      color: var(--muted);
      font-size: 0.9375rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1.25rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0.875rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
    }
    .btn-primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
      font-weight: 600;
    }
    .btn-primary:hover { background: var(--primary-hover); color: #fff; }
    main { padding: 2.5rem 0 3rem; }
    .section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .section h2 {
      margin: 0 0 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
    }
    .section p { margin: 0 0 0.75rem; color: var(--muted); font-size: 0.9375rem; }
    .section p:last-child { margin-bottom: 0; }
    pre {
      margin: 1rem 0 0;
      padding: 1rem;
      overflow-x: auto;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--code-bg);
      color: var(--text);
      font-size: 0.8125rem;
      line-height: 1.5;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.8125rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      font-size: 0.875rem;
    }
    td {
      padding: 0.625rem 0.75rem;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    tr:last-child td { border-bottom: 0; }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid var(--border);
      background: var(--code-bg);
      color: var(--text);
      font-size: 0.75rem;
    }
    dl {
      display: grid;
      gap: 1rem;
      margin: 1rem 0 0;
      grid-template-columns: 1fr;
    }
    @media (min-width: 640px) {
      dl { grid-template-columns: 1fr 1fr; }
    }
    dt {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    dd {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      word-break: break-all;
    }
    footer {
      border-top: 1px solid var(--border);
      background: var(--surface);
      padding: 1.5rem 0;
      font-size: 0.75rem;
      color: var(--muted);
    }
    footer .wrap {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    @media (min-width: 640px) {
      footer .wrap {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }
  </style>
</head>
<body>
  ${buildStandalonePublicHeaderHtml(auth)}
  <div class="page-hero">
    <div class="wrap">
      <p class="eyebrow">REST API</p>
      <h1>Auroranexis API</h1>
      <p class="subtitle">Use the Auroranexis API to integrate clients, reports, risks, incidents, health, activity and webhooks into external systems.</p>
      <div class="actions">
        <a class="btn btn-primary" href="/docs/api">Open full API documentation</a>
        <a class="btn" href="/api/docs/openapi">OpenAPI JSON</a>
        <a class="btn" href="${appShortcut.href}">${appShortcut.label}</a>
      </div>
    </div>
  </div>

  <main>
    <div class="wrap">
      <section class="section" id="overview">
        <h2>Overview</h2>
        <p>The ${COMPANY_NAME} REST API is organization-scoped. All requests are authenticated with API keys and limited to the scopes assigned at key creation.</p>
        <dl>
          <div><dt>Base URL</dt><dd><code>${API_BASE_PATH}</code></dd></div>
          <div><dt>Version</dt><dd><code>v1</code></dd></div>
          <div><dt>Format</dt><dd><code>application/json</code></dd></div>
          <div><dt>Documentation</dt><dd><a href="/docs/api">/docs/api</a></dd></div>
        </dl>
      </section>

      <section class="section" id="authentication">
        <h2>Authentication</h2>
        <p>Send your API key in the <code>Authorization</code> header using the Bearer scheme.</p>
        <pre>Authorization: Bearer ax_live_xxxxx</pre>
      </section>

      <section class="section" id="api-keys">
        <h2>API Keys</h2>
        <p>Create and revoke keys in Settings → API after signing in. Keys are shown once at creation — store them in a secrets manager and rotate them when access changes.</p>
        <p>Live keys use the <code>ax_live_</code> prefix. Test keys use <code>ax_test_</code> for non-production integrations.</p>
      </section>

      <section class="section" id="scopes">
        <h2>Scopes</h2>
        <p>Each key is limited to assigned scopes. Requests outside those scopes return HTTP 403.</p>
        <table aria-label="API scopes">
          <tbody>${scopeRows}</tbody>
        </table>
      </section>

      <section class="section" id="endpoints">
        <h2>Available Endpoints</h2>
        <p>Core read endpoints for workspace integration. See <a href="/docs/api">full API documentation</a> for write operations, pagination, and schemas.</p>
        <table aria-label="Available endpoints">
          <tbody>${endpointRows}</tbody>
        </table>
      </section>

      <section class="section" id="webhooks">
        <h2>Webhooks</h2>
        <p>Register HTTPS endpoints in Settings → API to receive signed outbound events when operational data changes.</p>
        <pre>x-auroranexis-signature: sha256_hex_digest
x-auroranexis-timestamp: 1710000000
x-auroranexis-event: report.published</pre>
        <p>Supported event types:</p>
        <div class="tags">${webhookTags}</div>
      </section>

      <section class="section" id="rate-limits">
        <h2>Rate Limits</h2>
        <p>API requests are rate-limited per organization and plan tier. Exceeding limits returns HTTP 429 with a <code>Retry-After</code> header.</p>
        <p>Monitor usage in Settings → API and Settings → Usage. Enterprise workspaces may request higher limits during onboarding.</p>
      </section>

      <section class="section" id="errors">
        <h2>Error Format</h2>
        <p>Errors return a consistent JSON envelope with an HTTP 4xx or 5xx status code.</p>
        <pre>{
  "error": {
    "code": "string",
    "message": "string"
  }
}</pre>
      </section>

      <section class="section" id="support">
        <h2>Support</h2>
        <p>Integration questions: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        <p>Guides and examples: <a href="/docs/api">/docs/api</a></p>
      </section>
    </div>
  </main>

  <footer>
    <div class="wrap">
      <p>© ${year} ${COMPANY_NAME}</p>
      <p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
    </div>
  </footer>
</body>
</html>`;
}
