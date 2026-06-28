"use client";

import { useEffect, useState } from "react";
import { getFirstName, getTimeGreeting } from "@/lib/dashboard/display";

type CommandCenterGreetingProps = {
  userName: string;
};

/** Client-only time greeting to avoid SSR/client hydration mismatch. */
export function CommandCenterGreeting({ userName }: CommandCenterGreetingProps) {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  const firstName = getFirstName(userName);

  return (
    <p className="mt-1 text-sm font-medium text-muted" suppressHydrationWarning>
      {greeting ? `${greeting}, ${firstName}` : firstName}
    </p>
  );
}
