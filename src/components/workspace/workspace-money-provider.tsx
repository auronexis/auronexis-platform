"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useUserPreferences } from "@/components/profile/user-preferences-provider";
import {
  DEFAULT_CURRENCY,
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_TIMEZONE,
  formatAppDate,
  formatAppDateTime,
  formatAppNumber,
  formatAppPercent,
  formatWorkspaceMoney,
  type AppCurrency,
  type AppLocale,
  type FormatDateOptions,
  type OrganizationDateFormat,
  type OrganizationTimeFormat,
} from "@/lib/i18n";

type WorkspaceMoneyContextValue = {
  currency: AppCurrency;
  locale: AppLocale;
  timezone: string;
  dateFormat: OrganizationDateFormat;
  timeFormat: OrganizationTimeFormat;
  formatMoney: (amount: number) => string;
  formatNumber: (value: number, fractionDigits?: number) => string;
  formatPercent: (value: number | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
};

const WorkspaceMoneyContext = createContext<WorkspaceMoneyContextValue | null>(null);

type WorkspaceMoneyProviderProps = {
  currency: AppCurrency;
  locale?: AppLocale;
  timezone?: string;
  dateFormat?: OrganizationDateFormat;
  timeFormat?: OrganizationTimeFormat;
  children: ReactNode;
};

/** Provides organization workspace currency and regional formatters to dashboard client components. */
export function WorkspaceMoneyProvider({
  currency,
  locale = "en",
  timezone = DEFAULT_TIMEZONE,
  dateFormat = DEFAULT_DATE_FORMAT,
  timeFormat = DEFAULT_TIME_FORMAT,
  children,
}: WorkspaceMoneyProviderProps) {
  const { preferences, isHydrated } = useUserPreferences();

  const value = useMemo<WorkspaceMoneyContextValue>(() => {
    const displayLocale = locale;
    const displayTimezone =
      isHydrated && preferences.regional.timezone
        ? preferences.regional.timezone
        : timezone;
    const displayDateFormat =
      isHydrated && preferences.regional.dateFormat
        ? preferences.regional.dateFormat
        : dateFormat;
    const displayTimeFormat =
      isHydrated && preferences.regional.timeFormat
        ? preferences.regional.timeFormat
        : timeFormat;

    const dateOptions: FormatDateOptions = {
      locale: displayLocale,
      timeZone: displayTimezone,
      dateFormat: displayDateFormat,
      timeFormat: displayTimeFormat,
    };

    return {
      currency,
      locale: displayLocale,
      timezone: displayTimezone,
      dateFormat: displayDateFormat,
      timeFormat: displayTimeFormat,
      formatMoney: (amount: number) => formatWorkspaceMoney(amount, currency, displayLocale),
      formatNumber: (amount: number, fractionDigits = 0) =>
        formatAppNumber(amount, displayLocale, { maximumFractionDigits: fractionDigits }),
      formatPercent: (amount) => formatAppPercent(amount, displayLocale),
      formatDate: (value) => formatAppDate(value, dateOptions),
      formatDateTime: (value) => formatAppDateTime(value, dateOptions),
    };
  }, [
    currency,
    locale,
    timezone,
    dateFormat,
    timeFormat,
    isHydrated,
    preferences.regional.timezone,
    preferences.regional.dateFormat,
    preferences.regional.timeFormat,
  ]);

  return (
    <WorkspaceMoneyContext.Provider value={value}>{children}</WorkspaceMoneyContext.Provider>
  );
}

export function useWorkspaceMoney(): WorkspaceMoneyContextValue {
  const context = useContext(WorkspaceMoneyContext);
  if (!context) {
    return {
      currency: DEFAULT_CURRENCY,
      locale: "en",
      timezone: DEFAULT_TIMEZONE,
      dateFormat: DEFAULT_DATE_FORMAT,
      timeFormat: DEFAULT_TIME_FORMAT,
      formatMoney: (amount: number) => formatWorkspaceMoney(amount, DEFAULT_CURRENCY, "en"),
      formatNumber: (amount: number, fractionDigits = 0) =>
        formatAppNumber(amount, "en", { maximumFractionDigits: fractionDigits }),
      formatPercent: (amount) => formatAppPercent(amount, "en"),
      formatDate: (value) => formatAppDate(value, "en"),
      formatDateTime: (value) => formatAppDateTime(value, "en"),
    };
  }
  return context;
}
