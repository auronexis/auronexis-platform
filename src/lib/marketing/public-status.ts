import "server-only";

import type { StatusLevel } from "@/components/marketing/status-badge";
import { getOpenAIPlatformConfig } from "@/lib/ai/openai/config";
import {
  getOpenAIPlatformStatus,
  type OpenAIPlatformStatus,
} from "@/lib/ai/openai/status";

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

  if (components.some((component) => component.status === "degraded")) {
    return { label: "Degraded performance", tierLabel: "Some services limited", color: "amber" };
  }

  if (components.some((component) => component.status === "maintenance")) {
    return { label: "Operational", tierLabel: "Core services available", color: "green" };
  }

  return { label: "Operational", tierLabel: "All customer services available", color: "green" };
}
