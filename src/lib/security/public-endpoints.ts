export type PublicEndpointProtection = {
  path: string;
  methods: string[];
  protection: string;
  authenticated: boolean;
};

/** Registry of public API routes and their abuse protections — keep in sync with route handlers. */
export const PUBLIC_ENDPOINT_REGISTRY: PublicEndpointProtection[] = [
  {
    path: "/api/health",
    methods: ["GET"],
    protection: "read-only JSON probe; rate limited",
    authenticated: false,
  },
  {
    path: "/api/stripe/webhook",
    methods: ["POST"],
    protection: "Stripe signature + idempotency table",
    authenticated: false,
  },
  {
    path: "/api/stripe/webhook-v2",
    methods: ["POST"],
    protection: "Stripe signature (STRIPE_WEBHOOK_SECRET_V2) + idempotency table",
    authenticated: false,
  },
  {
    path: "/api/cron/run",
    methods: ["GET", "POST"],
    protection: "Bearer CRON_SECRET required",
    authenticated: true,
  },
  {
    path: "/api/docs",
    methods: ["GET"],
    protection: "public API reference page",
    authenticated: false,
  },
  {
    path: "/api/docs/openapi",
    methods: ["GET"],
    protection: "OpenAPI JSON spec",
    authenticated: false,
  },
  {
    path: "/api/connectors/oauth/*/authorize",
    methods: ["GET"],
    protection: "session + RBAC + OAuth state",
    authenticated: true,
  },
  {
    path: "/api/connectors/oauth/*/callback",
    methods: ["GET"],
    protection: "OAuth state validation + org match",
    authenticated: false,
  },
  {
    path: "/api/v1/*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    protection: "API key + scope + plan rate limit (429)",
    authenticated: true,
  },
];

export function countUnprotectedPublicEndpoints(): number {
  return PUBLIC_ENDPOINT_REGISTRY.filter(
    (entry) => !entry.authenticated && entry.protection === "none",
  ).length;
}
