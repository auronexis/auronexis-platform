"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_CURRENCY,
  formatWorkspaceMoney,
  type AppCurrency,
  type AppLocale,
} from "@/lib/i18n";

type WorkspaceMoneyContextValue = {
  currency: AppCurrency;
  locale: AppLocale;
  formatMoney: (amount: number) => string;
};

const WorkspaceMoneyContext = createContext<WorkspaceMoneyContextValue | null>(null);

type WorkspaceMoneyProviderProps = {
  currency: AppCurrency;
  locale?: AppLocale;
  children: ReactNode;
};

/** Provides organization workspace currency to dashboard client components. */
export function WorkspaceMoneyProvider({
  currency,
  locale = "en",
  children,
}: WorkspaceMoneyProviderProps) {
  const value: WorkspaceMoneyContextValue = {
    currency,
    locale,
    formatMoney: (amount: number) => formatWorkspaceMoney(amount, currency, locale),
  };

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
      formatMoney: (amount: number) => formatWorkspaceMoney(amount, DEFAULT_CURRENCY, "en"),
    };
  }
  return context;
}
