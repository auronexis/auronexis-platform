"use client";

import { useEffect, useState } from "react";
import { getFirstName, getTimeGreeting } from "@/lib/dashboard/display";

type TimeOfDayGreetingProps = {
  userName: string;
  /** Optional suffix after the name (e.g. "."). */
  trailing?: string;
  className?: string;
};

/**
 * Time-of-day greeting rendered only after mount.
 * Initial SSR + hydration paint the name alone so server/client HTML matches
 * across timezones (Vercel UTC vs visitor local).
 */
export function TimeOfDayGreeting({
  userName,
  trailing = "",
  className,
}: TimeOfDayGreetingProps) {
  const [greeting, setGreeting] = useState<string | null>(null);
  const firstName = getFirstName(userName);

  useEffect(() => {
    setGreeting(getTimeGreeting());
  }, []);

  // SSR + first client paint: name only (no trailing) so markup matches across timezones
  // and we avoid a "Name." → "Good evening, Name." punctuation flash.
  const text = greeting ? `${greeting}, ${firstName}${trailing}` : firstName;

  return <span className={className}>{text}</span>;
}
