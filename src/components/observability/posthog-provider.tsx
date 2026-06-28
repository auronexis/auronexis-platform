"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

type PostHogProviderProps = {
  children: React.ReactNode;
};

let posthogInitialized = false;

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

    if (!key || posthogInitialized) {
      return;
    }

    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
    posthogInitialized = true;
  }, []);

  return children;
}
