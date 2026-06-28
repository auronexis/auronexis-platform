"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type MobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((current) => !current), []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, setOpen, toggle, close }),
    [close, open, toggle],
  );

  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav(): MobileNavContextValue {
  const context = useContext(MobileNavContext);

  if (!context) {
    throw new Error("useMobileNav must be used within MobileNavProvider.");
  }

  return context;
}
