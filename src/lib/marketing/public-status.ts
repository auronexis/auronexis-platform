import type { StatusLevel } from "@/components/marketing/status-badge";

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

export function resolvePublicAiStatus(): Pick<PublicStatusComponent, "status" | "detail"> {
  if (process.env.OPENAI_API_KEY) {
    return { status: "operational", detail: "Operational" };
  }

  return { status: "maintenance", detail: "Not Enabled" };
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
    return { ...component, ...resolvePublicAiStatus() };
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
