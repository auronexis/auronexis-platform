export type ClientHealth = "healthy" | "watch" | "critical";

export type ClientProfitabilityRow = {
  clientId: string;
  clientName: string;
  monthlyRevenue: number;
  monthlyCost: number;
  profit: number;
  margin: number | null;
  health: ClientHealth;
  hasCriticalRisk: boolean;
  hasCriticalIncident: boolean;
  notes: string | null;
  financialId: string | null;
};

export type ProfitabilitySummary = {
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  averageMargin: number | null;
};

export type ClientHealthCounts = {
  totalClients: number;
  healthyClients: number;
  watchClients: number;
  criticalClients: number;
};

export const CLIENT_HEALTH_LABELS: Record<ClientHealth, string> = {
  healthy: "Healthy",
  watch: "Watch",
  critical: "Critical",
};

export function calculateProfit(revenue: number, cost: number): number {
  return revenue - cost;
}

export function calculateMargin(revenue: number, cost: number): number | null {
  if (revenue <= 0) {
    return null;
  }

  return (calculateProfit(revenue, cost) / revenue) * 100;
}

export function calculateClientHealth(
  margin: number | null,
  hasCriticalRisk: boolean,
  hasCriticalIncident: boolean,
): ClientHealth {
  if (hasCriticalIncident) {
    return "critical";
  }

  if (margin !== null && margin < 20) {
    return "critical";
  }

  if (hasCriticalRisk) {
    return "watch";
  }

  if (margin !== null && margin >= 20 && margin < 40) {
    return "watch";
  }

  if (margin !== null && margin >= 40) {
    return "healthy";
  }

  return "watch";
}

import type { AppCurrency } from "@/lib/i18n/currency";
import { formatWorkspaceMoney } from "@/lib/i18n/format";
import { formatAppPercent } from "@/lib/i18n/number";
import type { AppLocale } from "@/lib/i18n/types";

export function formatCurrency(
  value: number,
  currency: AppCurrency,
  locale: AppLocale = "en",
): string {
  return formatWorkspaceMoney(value, currency, locale);
}

export function formatMargin(value: number | null, locale: AppLocale = "en"): string {
  return formatAppPercent(value, locale);
}

export function summarizeProfitability(rows: ClientProfitabilityRow[]): ProfitabilitySummary {
  const monthlyRevenue = rows.reduce((sum, row) => sum + row.monthlyRevenue, 0);
  const monthlyCost = rows.reduce((sum, row) => sum + row.monthlyCost, 0);
  const monthlyProfit = calculateProfit(monthlyRevenue, monthlyCost);
  const margins = rows.map((row) => row.margin).filter((margin): margin is number => margin !== null);
  const averageMargin =
    margins.length > 0 ? margins.reduce((sum, margin) => sum + margin, 0) / margins.length : null;

  return {
    monthlyRevenue,
    monthlyCost,
    monthlyProfit,
    averageMargin,
  };
}

export function summarizeClientHealth(rows: ClientProfitabilityRow[]): ClientHealthCounts {
  return {
    totalClients: rows.length,
    healthyClients: rows.filter((row) => row.health === "healthy").length,
    watchClients: rows.filter((row) => row.health === "watch").length,
    criticalClients: rows.filter((row) => row.health === "critical").length,
  };
}
