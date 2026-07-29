"use client";

import { TimeOfDayGreeting } from "@/components/dashboard/time-of-day-greeting";

type CommandCenterGreetingProps = {
  userName: string;
};

/** Client-only time greeting to avoid SSR/client hydration mismatch. */
export function CommandCenterGreeting({ userName }: CommandCenterGreetingProps) {
  return (
    <p className="mt-1 text-sm font-medium text-muted">
      <TimeOfDayGreeting userName={userName} />
    </p>
  );
}
