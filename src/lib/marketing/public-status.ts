import "server-only";

import type { StatusLevel } from "@/lib/marketing/status-types";
import { getOpenAIPlatformConfig } from "@/lib/ai/openai/config";
import {
  getOpenAIPlatformStatus,
  type OpenAIPlatformStatus,
} from "@/lib/ai/openai/status";
import { checkDatabaseHealth, type DatabaseHealthLevel } from "@/lib/diagnostics/platform-health";
import {
  getPublicQueueHealthSummary,
  type PublicQueueHealthSummary,
} from "@/lib/queue/health";
import { isMollieApiConfigured } from "@/lib/billing/providers/mollie/env";
import { isMollieBillingRolloutEnabled } from "@/lib/billing/providers/mollie/rollout";

export type { StatusLevel };
export type PublicStatusComponent = {
  name: string;
  status: StatusLevel;
  detail: string;
};

/** Customer-impacting services shown on the public status page. */
export const PUBLIC_STATUS_COMPONENT_KEYS = [
  "Platform",
  "API",
  "Database",
  "Billing",
  "AI",
  "Connectors",
  "Automation",
] as const;

/** Short TTL so outages surface within ~1 minute while sharing work across requests. */
export const PUBLIC_STATUS_CACHE_TTL_MS = 45_000;
const PROBE_TIMEOUT_MS = 3_000;

const INTERNAL_STATUS_LABELS = new Set([
  "development",
  "partially configured",
  "provider configured",
  "provider not configured",
  "stripe not configured",
  "optional in development",
  "not configured",
  "monitoring optional in development",
]);

type PublicAiStatus = Pick<PublicStatusComponent, "status" | "detail">;

type CacheEntry = {
  value: Record<string, PublicStatusComponent>;
  expiresAt: number;
};

let cachedSnapshot: CacheEntry | null = null;
let inFlightSnapshot: Promise<Record<string, PublicStatusComponent>> | null = null;

function resolveConfigurationDetail(config: ReturnType<typeof getOpenAIPlatformConfig>): string {
  if (!config.enabled) {
    return "Provider Disabled";
  }
  if (config.provider !== "openai") {
    return "Invalid Configuration";
  }
  if (!config.apiKey) {
    return "Missing API Key";
  }
  return "Operational";
}

function resolveDegradedDetail(platform: OpenAIPlatformStatus): string {
  const error = platform.sanitizedError?.trim();
  if (!error) {
    return "Provider Unavailable";
  }

  const normalized = error.toLowerCase();
  if (normalized.includes("timeout") || normalized.includes("timed out")) {
    return "API Timeout";
  }
  if (normalized.includes("unavailable") || normalized.includes("503") || normalized.includes("502")) {
    return "Provider Unavailable";
  }

  return error;
}

function mapPlatformToPublicAi(platform: OpenAIPlatformStatus): PublicAiStatus {
  const config = getOpenAIPlatformConfig();

  if (!config.enabled) {
    return { status: "maintenance", detail: "Provider Disabled" };
  }

  if (config.provider !== "openai") {
    return { status: "maintenance", detail: "Invalid Configuration" };
  }

  if (!config.apiKey) {
    return { status: "maintenance", detail: "Missing API Key" };
  }

  switch (platform.state) {
    case "connected":
    case "configured":
      return { status: "operational", detail: "Operational" };
    case "degraded":
      return { status: "degraded", detail: resolveDegradedDetail(platform) };
    case "disabled":
      return { status: "maintenance", detail: "Provider Disabled" };
    case "not_configured":
      return { status: "maintenance", detail: resolveConfigurationDetail(config) };
    default:
      return { status: "operational", detail: "Operational" };
  }
}

export async function resolvePublicAiStatus(): Promise<PublicAiStatus> {
  try {
    const platform = await getOpenAIPlatformStatus();
    return mapPlatformToPublicAi(platform);
  } catch {
    return { status: "degraded", detail: "Status check unavailable" };
  }
}

function sanitizePublicDetail(detail: string): string {
  const normalized = detail.trim().toLowerCase();
  if (INTERNAL_STATUS_LABELS.has(normalized)) {
    return "Service available";
  }
  if (normalized.includes("not configured")) {
    return "Limited availability";
  }
  if (normalized.includes("development")) {
    return "Service available";
  }
  if (normalized.includes("provider configured")) {
    return "Operational";
  }
  if (normalized.includes("provider not configured")) {
    return "Not Enabled";
  }
  return detail;
}

export function sanitizePublicStatusComponent(component: PublicStatusComponent): PublicStatusComponent {
  if (component.name === "AI") {
    return component;
  }

  return {
    ...component,
    detail: sanitizePublicDetail(component.detail),
    status:
      component.detail.toLowerCase().includes("not configured") && component.name !== "AI"
        ? component.status === "incident"
          ? "incident"
          : "degraded"
        : component.status,
  };
}

export function filterPublicStatusComponents(components: PublicStatusComponent[]): PublicStatusComponent[] {
  const allowed = new Set<string>(PUBLIC_STATUS_COMPONENT_KEYS);
  return components
    .filter((component) => allowed.has(component.name))
    .map(sanitizePublicStatusComponent);
}

export function resolvePublicOverallStatus(components: PublicStatusComponent[]): {
  label: string;
  tierLabel: string;
  color: "green" | "amber" | "orange" | "red";
} {
  if (components.some((component) => component.status === "incident")) {
    return { label: "Service disruption", tierLabel: "Customer impact detected", color: "orange" };
  }

  if (components.some((component) => component.status === "degraded" || component.status === "unknown")) {
    return { label: "Degraded performance", tierLabel: "Some services limited", color: "amber" };
  }

  if (components.some((component) => component.status === "maintenance")) {
    return { label: "Operational", tierLabel: "Core services available", color: "green" };
  }

  return { label: "Operational", tierLabel: "All customer services available", color: "green" };
}

function mapHealth(ok: boolean, degraded = false): StatusLevel {
  if (ok) return "operational";
  if (degraded) return "degraded";
  return "incident";
}

function mapDatabaseLevel(level: DatabaseHealthLevel): StatusLevel {
  if (level === "healthy") return "operational";
  if (level === "degraded") return "degraded";
  return "incident";
}

function publicSafeDatabaseDetail(level: DatabaseHealthLevel, surface: "platform" | "database"): string {
  if (level === "healthy") {
    return surface === "platform" ? "Application services available" : "Data services available";
  }
  if (level === "degraded") {
    return surface === "platform" ? "Application services limited" : "Data services limited";
  }
  return surface === "platform" ? "Application services impacted" : "Data services impacted";
}

async function withProbeTimeout<T>(promise: Promise<T>, timeoutMs = PROBE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("probe_timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function unknownComponent(name: string): PublicStatusComponent {
  return {
    name,
    status: "unknown",
    detail: "Status check unavailable",
  };
}

function settledValue<T>(
  result: PromiseSettledResult<T>,
): { ok: true; value: T } | { ok: false } {
  if (result.status === "fulfilled") {
    return { ok: true, value: result.value };
  }
  return { ok: false };
}

async function computeLiveStatusOverrides(): Promise<Record<string, PublicStatusComponent>> {
  const [databaseResult, queueResult, aiResult] = await Promise.allSettled([
    withProbeTimeout(checkDatabaseHealth()),
    withProbeTimeout(getPublicQueueHealthSummary()),
    withProbeTimeout(resolvePublicAiStatus()),
  ]);

  const databaseSettled = settledValue(databaseResult);
  const queueSettled = settledValue(queueResult);
  const aiSettled = settledValue(aiResult);

  const billingConfigured = isMollieApiConfigured() && isMollieBillingRolloutEnabled();

  const database = databaseSettled.ok ? databaseSettled.value : null;
  const queue: PublicQueueHealthSummary | null = queueSettled.ok ? queueSettled.value : null;
  const aiStatus: PublicAiStatus = aiSettled.ok
    ? aiSettled.value
    : { status: "unknown", detail: "Status check unavailable" };

  return {
    Platform: database
      ? {
          name: "Platform",
          status: mapDatabaseLevel(database.level),
          detail: publicSafeDatabaseDetail(database.level, "platform"),
        }
      : unknownComponent("Platform"),
    API: database
      ? {
          name: "API",
          status: database.level === "unavailable" ? "incident" : "operational",
          detail: "Application and authenticated API routes",
        }
      : unknownComponent("API"),
    Database: database
      ? {
          name: "Database",
          status: mapDatabaseLevel(database.level),
          detail: publicSafeDatabaseDetail(database.level, "database"),
        }
      : unknownComponent("Database"),
    Billing: {
      name: "Billing",
      status: billingConfigured ? "operational" : "degraded",
      detail: billingConfigured
        ? "Subscription billing available"
        : "Billing availability limited",
    },
    AI: {
      name: "AI",
      status: aiStatus.status,
      detail: aiStatus.detail,
    },
    Connectors: {
      name: "Connectors",
      status: "operational",
      detail: "Integration infrastructure available",
    },
    Automation: queue
      ? {
          name: "Automation",
          status: mapHealth(queue.tableReachable && queue.status !== "unavailable", queue.status === "degraded"),
          detail: "Workflow execution services",
        }
      : unknownComponent("Automation"),
  };
}

/**
 * Live probes for the public marketing status page.
 * Cached briefly with in-flight dedupe so concurrent visitors share one computation.
 */
export async function getLiveStatusOverrides(): Promise<Record<string, PublicStatusComponent>> {
  const now = Date.now();
  if (cachedSnapshot && cachedSnapshot.expiresAt > now) {
    return cachedSnapshot.value;
  }

  if (inFlightSnapshot) {
    return inFlightSnapshot;
  }

  inFlightSnapshot = computeLiveStatusOverrides()
    .then((value) => {
      cachedSnapshot = {
        value,
        expiresAt: Date.now() + PUBLIC_STATUS_CACHE_TTL_MS,
      };
      return value;
    })
    .finally(() => {
      inFlightSnapshot = null;
    });

  return inFlightSnapshot;
}

/** Test helper — clears the process-local public status cache. */
export function clearPublicStatusCacheForTests(): void {
  cachedSnapshot = null;
  inFlightSnapshot = null;
}
