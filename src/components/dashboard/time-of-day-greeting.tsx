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

  const text = greeting ? `${greeting}, ${firstName}` : firstName;

  return <span className={className}>{`${text}${trailing}`}</span>;
}
