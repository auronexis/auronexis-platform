export type PlatformReadinessState =
  | "operational"
  | "development"
  | "partially_configured"
  | "degraded"
  | "incident"
  | "unavailable";

export type PlatformReadinessColor = "green" | "blue" | "amber" | "orange" | "red";

export type PlatformServiceStatus = "healthy" | "degraded" | "warning" | "unavailable" | "unknown";

export type PlatformReadinessInput = {
  environment: string;
  nodeEnv: string;
  databaseOk: boolean;
  authOk: boolean;
  healthProbeOk: boolean;
  stripeConfigured: boolean;
  stripeWebhookReachable: boolean;
  cronSecretConfigured: boolean;
  cronOk: boolean;
  queueOk: boolean;
  sentryConfigured: boolean;
  posthogConfigured: boolean;
  stripeWebhookFailures?: number;
};

export type PlatformReadinessStatus = {
  state: PlatformReadinessState;
  label: string;
  color: PlatformReadinessColor;
  score: number;
  tierLabel: string;
};

export function isDevelopmentEnvironment(environment: string, nodeEnv: string): boolean {
  return nodeEnv === "development" || environment === "development";
}

function countOptionalGaps(input: PlatformReadinessInput): number {
  let gaps = 0;
  if (!input.stripeConfigured) gaps += 1;
  if (!input.cronSecretConfigured) gaps += 1;
  if (!input.sentryConfigured) gaps += 1;
  if (!input.posthogConfigured) gaps += 1;
  return gaps;
}

function computeReadinessScore(input: PlatformReadinessInput, isDev: boolean): number {
  if (!input.databaseOk || !input.authOk) {
    return 40;
  }

  let score = 0;

  score += 35;
  score += input.queueOk ? 15 : isDev ? 10 : 5;

  if (input.healthProbeOk) {
    score += 10;
  } else if (isDev) {
    score += 6;
  }

  if (input.stripeConfigured && input.stripeWebhookReachable) {
    score += 15;
  } else if (isDev) {
    score += 10;
  } else if (input.stripeConfigured) {
    score += 8;
  }

  if (input.cronSecretConfigured && input.cronOk) {
    score += 15;
  } else if (isDev) {
    score += 10;
  } else if (input.cronOk) {
    score += 8;
  }

  if (input.sentryConfigured || input.posthogConfigured) {
    score += 10;
  } else if (isDev) {
    score += 5;
  } else {
    score += 3;
  }

  return Math.min(100, Math.round(score));
}

function resolveTierLabel(score: number): string {
  if (score >= 100) return "Go-Live Ready";
  if (score >= 98) return "Pilot Execution Ready";
  if (score >= 97) return "Production Ready";
  if (score >= 90) return "Pilot Ready";
  if (score >= 75) return "Development";
  return "Needs Attention";
}

function resolveReadinessColor(state: PlatformReadinessState): PlatformReadinessColor {
  switch (state) {
    case "operational":
      return "green";
    case "development":
      return "blue";
    case "partially_configured":
    case "degraded":
      return "amber";
    case "incident":
      return "orange";
    case "unavailable":
      return "red";
  }
}

function resolveReadinessLabel(state: PlatformReadinessState): string {
  switch (state) {
    case "operational":
      return "Operational";
    case "development":
      return "Development";
    case "partially_configured":
      return "Partially Configured";
    case "degraded":
      return "Degraded";
    case "incident":
      return "Incident";
    case "unavailable":
      return "Unavailable";
  }
}

/** Environment-aware platform readiness for dashboard status and diagnostics UX. */
export function getPlatformReadinessStatus(input: PlatformReadinessInput): PlatformReadinessStatus {
  const isDev = isDevelopmentEnvironment(input.environment, input.nodeEnv);
  const score = computeReadinessScore(input, isDev);

  const criticalFailure = !input.databaseOk || !input.authOk;
  const activeIncident =
    (input.stripeWebhookFailures ?? 0) > 0 ||
    (!isDev && input.stripeWebhookReachable === false && input.stripeConfigured);

  let state: PlatformReadinessState;

  if (criticalFailure) {
    state = "unavailable";
  } else if (activeIncident) {
    state = "incident";
  } else if (isDev) {
    const optionalGaps = countOptionalGaps(input);
    if (optionalGaps === 0) {
      state = "operational";
    } else if (optionalGaps >= 2) {
      state = "partially_configured";
    } else {
      state = "development";
    }
  } else if (!input.stripeConfigured || !input.cronSecretConfigured || !input.cronOk) {
    state = "degraded";
  } else {
    state = "operational";
  }

  return {
    state,
    label: resolveReadinessLabel(state),
    color: resolveReadinessColor(state),
    score,
    tierLabel: resolveTierLabel(score),
  };
}

export function evaluateServiceStatus(
  key: "database" | "stripe" | "cron" | "queue" | "health" | "observability",
  input: PlatformReadinessInput,
): PlatformServiceStatus {
  const isDev = isDevelopmentEnvironment(input.environment, input.nodeEnv);

  switch (key) {
    case "database":
      return input.databaseOk ? "healthy" : "unavailable";
    case "queue":
      if (input.queueOk) return "healthy";
      return isDev ? "degraded" : "unavailable";
    case "stripe":
      if (input.stripeConfigured && input.stripeWebhookReachable) return "healthy";
      if (!input.stripeConfigured) return isDev ? "degraded" : "degraded";
      return isDev ? "degraded" : "unavailable";
    case "cron":
      if (input.cronSecretConfigured && input.cronOk) return "healthy";
      if (!input.cronSecretConfigured) return isDev ? "degraded" : "degraded";
      return isDev ? "degraded" : "unavailable";
    case "health":
      if (!input.databaseOk || !input.authOk) return "unavailable";
      if (isDev) {
        return input.databaseOk && input.queueOk ? "healthy" : "degraded";
      }
      return input.healthProbeOk ? "healthy" : "degraded";
    case "observability":
      if (input.sentryConfigured || input.posthogConfigured) return "healthy";
      return isDev ? "degraded" : "warning";
    default:
      return "unknown";
  }
}

export function buildHealthProbeOk(input: PlatformReadinessInput): boolean {
  const isDev = isDevelopmentEnvironment(input.environment, input.nodeEnv);
  if (!input.databaseOk || !input.authOk) {
    return false;
  }
  if (isDev) {
    return input.databaseOk && input.queueOk;
  }
  return (
    input.databaseOk &&
    input.queueOk &&
    input.stripeWebhookReachable &&
    input.cronOk &&
    input.cronSecretConfigured
  );
}
