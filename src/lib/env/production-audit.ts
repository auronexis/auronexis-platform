import "server-only";

import { ANALYTICS_CONFIG } from "@/lib/analytics/config";
import { isEmailConfigured, getEmailProviderId } from "@/lib/env/email";
import { getMollieApiKeyPresence } from "@/lib/billing/providers/mollie/env";
import { isMollieBillingRolloutEnabled } from "@/lib/billing/providers/mollie/rollout";

export type EnvAuditSeverity = "required" | "recommended" | "optional";

export type EnvAuditItem = {
  key: string;
  label: string;
  severity: EnvAuditSeverity;
  configured: boolean;
  note?: string;
};

export type ProductionEnvAudit = {
  readyForCustomers: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  items: EnvAuditItem[];
};

function isSet(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

/** Non-throwing production environment audit — safe for diagnostics pages. */
export function auditProductionEnvironment(): ProductionEnvAudit {
  const items: EnvAuditItem[] = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL", severity: "required", configured: isSet("NEXT_PUBLIC_SUPABASE_URL") },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase anon key", severity: "required", configured: isSet("NEXT_PUBLIC_SUPABASE_ANON_KEY") },
    { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role", severity: "required", configured: isSet("SUPABASE_SERVICE_ROLE_KEY") },
    { key: "NEXT_PUBLIC_APP_URL", label: "Application URL", severity: "required", configured: isSet("NEXT_PUBLIC_APP_URL") },
    {
      key: "MOLLIE_API_KEY",
      label: "Mollie API key",
      severity: "required",
      configured: getMollieApiKeyPresence().configured,
      note: "Sole active billing provider — test_ or live_ prefix",
    },
    {
      key: "MOLLIE_BILLING_ROLLOUT",
      label: "Mollie billing rollout",
      severity: "required",
      configured: isMollieBillingRolloutEnabled(),
      note: "Must be true for self-serve Mollie checkout eligibility",
    },
    {
      key: "MOLLIE_LIVE_CHARGING_ENABLED",
      label: "Mollie LIVE charging",
      severity: "optional",
      configured: true,
      note: "Keep false until explicit LIVE go-live approval — presence optional",
    },
    {
      key: "CRON_SECRET",
      label: "Cron bearer secret",
      severity: "required",
      configured: isSet("CRON_SECRET"),
      note: "Required in production — cron auth fails closed without it outside development",
    },
    {
      key: "EMAIL_PROVIDER",
      label: `Email provider (${getEmailProviderId()})`,
      severity: "recommended",
      configured: isEmailConfigured(),
      note: "Required for report delivery and lead notifications",
    },
    {
      key: "E2E_DISABLE_RATE_LIMIT",
      label: "E2E rate-limit disable flag",
      severity: "optional",
      configured: !isSet("E2E_DISABLE_RATE_LIMIT"),
      note: "Must remain unset in production; bypass is blocked when NODE_ENV=production",
    },
    {
      key: "DEV_FORCE_PLAN",
      label: "Dev plan override",
      severity: "optional",
      configured: !isSet("DEV_FORCE_PLAN"),
      note: "Ignored in production by getDevForcePlanOverride()",
    },
    {
      key: "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
      label: "Plausible analytics",
      severity: "optional",
      configured: ANALYTICS_CONFIG.plausible.enabled,
      note: "Loads only after analytics consent",
    },
    {
      key: "NEXT_PUBLIC_CLARITY_PROJECT_ID",
      label: "Microsoft Clarity",
      severity: "optional",
      configured: ANALYTICS_CONFIG.clarity.enabled,
      note: "Loads only after analytics consent",
    },
    {
      key: "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
      label: "Google Search Console verification",
      severity: "optional",
      configured: isSet("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"),
    },
    {
      key: "NEXT_PUBLIC_BING_SITE_VERIFICATION",
      label: "Bing Webmaster verification",
      severity: "optional",
      configured: isSet("NEXT_PUBLIC_BING_SITE_VERIFICATION"),
    },
    {
      key: "INDEXNOW_KEY",
      label: "IndexNow key",
      severity: "optional",
      configured: isSet("INDEXNOW_KEY"),
      note: "Enables daily sitemap URL submission to Bing and participating engines",
    },
  ];

  const missingRequired = items
    .filter((item) => item.severity === "required" && !item.configured)
    .map((item) => item.key);
  const missingRecommended = items
    .filter((item) => item.severity === "recommended" && !item.configured)
    .map((item) => item.key);

  return {
    readyForCustomers: missingRequired.length === 0,
    missingRequired,
    missingRecommended,
    items,
  };
}
