"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MarketingAuthState } from "@/lib/marketing/auth-context";

const MarketingAuthContext = createContext<MarketingAuthState>({ isAuthenticated: false });

export function MarketingAuthProvider({
  value,
  children,
}: {
  value: MarketingAuthState;
  children: ReactNode;
}) {
  return <MarketingAuthContext.Provider value={value}>{children}</MarketingAuthContext.Provider>;
}

export function useMarketingAuth(): MarketingAuthState {
  return useContext(MarketingAuthContext);
}
