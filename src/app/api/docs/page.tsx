import Link from "next/link";
import type { Metadata } from "next";
import { buildOpenApiSpec } from "@/lib/api/openapi/spec";
import { ALL_API_SCOPES, API_SCOPE_LABELS } from "@/lib/api/types";
import { API_BASE_PATH } from "@/lib/api/versioning/constants";
import {
  COMPANY_NAME,
  MARKETING_ROUTES,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/types";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Auroranexis API",
  description: "Auroranexis REST API authentication, scopes, endpoints, webhooks, and OpenAPI specification.",
};

function collectEndpoints(spec: ReturnType<typeof buildOpenApiSpec>) {
  const endpoints: Array<{ path: string; method: string; summary: string; tags: string[] }> = [];

  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(
      methods as Record<string, { summary?: string; tags?: string[] }>,
    )) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
      endpoints.push({
        path,
        method: method.toUpperCase(),
        summary: operation.summary ?? path,
        tags: operation.tags ?? ["General"],
      });
    }
  }

  return endpoints.sort((a, b) => a.path.localeCompare(b.path));
}

function groupEndpointsByTag(
  endpoints: ReturnType<typeof collectEndpoints>,
): Map<string, ReturnType<typeof collectEndpoints>> {
  const groups = new Map<string, ReturnType<typeof collectEndpoints>>();

  for (const endpoint of endpoints) {
    const tag = endpoint.tags[0] ?? "General";
    const existing = groups.get(tag) ?? [];
    existing.push(endpoint);
    groups.set(tag, existing);
  }

  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

const methodStyles: Record<string, string> = {
  GET: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  POST: "border-primary/30 bg-primary/10 text-primary",
  PUT: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  PATCH: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  DELETE: "border-danger/30 bg-danger/10 text-danger",
};

export default function PublicApiDocsPage() {
  const spec = buildOpenApiSpec();
  const endpoints = collectEndpoints(spec);
  const endpointGroups = groupEndpointsByTag(endpoints);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-surface/40">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">REST API</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Auroranexis API</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Organization-scoped REST API for clients, reports, risks, incidents, automation, and integrations.
              Authenticate with scoped API keys and receive signed outbound webhooks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/docs/api"
              className={cn(
                "rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/10",
                focusRing,
              )}
            >
              Documentation
            </Link>
            <Link
              href="/login"
              className={cn(
                "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground",
                focusRing,
              )}
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            The {COMPANY_NAME} REST API is organization-scoped. Authenticate with an API key using bearer
            authorization. Manage keys in Settings → API after signing in.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Base URL</dt>
              <dd className="mt-1 break-all font-mono text-sm text-foreground">{API_BASE_PATH}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">OpenAPI version</dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{spec.openapi}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Spec version</dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{spec.info.version}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Download</dt>
              <dd className="mt-1">
                <a
                  href="/api/docs/openapi"
                  className={cn("text-sm font-medium text-primary hover:underline", focusRing, "rounded")}
                >
                  OpenAPI JSON
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Authentication</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Send your API key in the Authorization header. Keys are shown once at creation — store them in a
            secrets manager and rotate them when access changes.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-muted/5 p-4 font-mono text-sm text-foreground">
            {`Authorization: Bearer anx_live_your_key_here`}
          </pre>
          <p className="mt-4 text-sm text-muted">
            Create and revoke keys in{" "}
            <Link href="/settings/api" className="font-medium text-primary hover:underline">
              Settings → API
            </Link>
            . Security reports:{" "}
            <a href={`mailto:${SECURITY_EMAIL}`} className="font-medium text-primary hover:underline">
              {SECURITY_EMAIL}
            </a>
            .
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">API scopes</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Each API key is limited to the scopes you assign at creation. Requests outside those scopes return
            HTTP 403. Assign the minimum scopes required for each integration.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {ALL_API_SCOPES.map((scope) => (
              <li
                key={scope}
                className="flex min-w-0 items-start gap-3 rounded-lg border border-border/60 bg-muted/5 px-3 py-2"
              >
                <code className="shrink-0 font-mono text-xs text-primary">{scope}</code>
                <span className="min-w-0 text-sm text-muted break-words">{API_SCOPE_LABELS[scope]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Register HTTPS endpoints in Settings → API to receive signed outbound events when operational data
            changes. Payloads include an HMAC signature header for verification.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-muted/5 p-4 font-mono text-sm text-foreground">
            {`x-auroranexis-signature: sha256_hex_digest
x-auroranexis-timestamp: 1710000000
x-auroranexis-event: report.published
x-auroranexis-delivery-id: del_abc123`}
          </pre>
          <p className="mt-4 text-sm text-muted">Supported event types:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((event) => (
              <li key={event}>
                <code className="rounded-md border border-border bg-muted/5 px-2 py-1 font-mono text-xs text-foreground">
                  {event}
                </code>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Endpoint groups</h2>
          <p className="mt-2 text-sm text-muted">
            Public REST endpoints grouped by resource. Download the{" "}
            <a href="/api/docs/openapi" className="font-medium text-primary hover:underline">
              OpenAPI JSON
            </a>{" "}
            for full request and response schemas.
          </p>
          <div className="mt-6 space-y-8">
            {[...endpointGroups.entries()].map(([tag, groupEndpoints]) => (
              <div key={tag}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{tag}</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                        <th className="px-3 py-2 font-semibold">Method</th>
                        <th className="px-3 py-2 font-semibold">Path</th>
                        <th className="px-3 py-2 font-semibold">Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupEndpoints.map((endpoint) => (
                        <tr
                          key={`${tag}-${endpoint.method}-${endpoint.path}`}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="px-3 py-3 align-top">
                            <span
                              className={cn(
                                "inline-flex rounded-md border px-2 py-0.5 font-mono text-xs font-semibold",
                                methodStyles[endpoint.method] ?? "border-border bg-muted/10 text-foreground",
                              )}
                            >
                              {endpoint.method}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-top font-mono text-foreground break-all">
                            {endpoint.path}
                          </td>
                          <td className="px-3 py-3 align-top text-muted break-words">{endpoint.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">All endpoints</h2>
          <p className="mt-2 text-sm text-muted">
            Public REST endpoints for clients, reports, risks, incidents, automation, AI, and integrations.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-semibold">Method</th>
                  <th className="px-3 py-2 font-semibold">Path</th>
                  <th className="px-3 py-2 font-semibold">Summary</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint) => (
                  <tr key={`${endpoint.method}-${endpoint.path}`} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-3 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2 py-0.5 font-mono text-xs font-semibold",
                          methodStyles[endpoint.method] ?? "border-border bg-muted/10 text-foreground",
                        )}
                      >
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top font-mono text-foreground break-all">{endpoint.path}</td>
                    <td className="px-3 py-3 align-top text-muted break-words">{endpoint.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-border bg-muted/5 p-6">
          <h2 className="text-base font-semibold">Need help?</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            For integration guidance, see{" "}
            <Link href="/docs/api" className="font-medium text-primary hover:underline">
              API documentation
            </Link>{" "}
            or email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
            . Marketing overview:{" "}
            <Link href={MARKETING_ROUTES.documentation} className="font-medium text-primary hover:underline">
              Documentation hub
            </Link>
            .
          </p>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-surface/40">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {COMPANY_NAME}
          </p>
          <p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
