"use client";

import { useEffect, useRef, useState } from "react";
import { TURNSTILE_RESPONSE_FIELD, getTurnstileSiteKey } from "@/lib/security/turnstile-shared";

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  appearance?: "always" | "execute" | "interaction-only";
  theme?: "light" | "dark" | "auto";
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        scriptPromise = null;
        reject(new Error("turnstile script failed to load"));
      },
      { once: true },
    );
    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return scriptPromise;
}

type TurnstileFieldProps = {
  /** Short label for Cloudflare analytics, e.g. "login" or "signup". */
  action: string;
  className?: string;
  /**
   * Change this value after every submit (e.g. the action state object) — Turnstile tokens are
   * single-use, so the widget fetches a fresh token for the next attempt.
   */
  resetKey?: unknown;
  onTokenChange?: (token: string) => void;
};

/**
 * Cloudflare Turnstile bot check. Renders nothing when no site key is configured.
 * Uses "interaction-only" appearance: most visitors never see a challenge.
 */
export function TurnstileField({ action, className, resetKey, onTokenChange }: TurnstileFieldProps) {
  const siteKey = getTurnstileSiteKey();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [token, setToken] = useState("");

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    onTokenChangeRef.current?.(token);
  }, [token]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return;
    }
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          appearance: "interaction-only",
          theme: "auto",
          callback: (value) => setToken(value),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
      })
      .catch(() => {
        // Script blocked (e.g. by an extension). The server rejects the submit with a clear
        // retry message; nothing else to do here.
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove?.(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, action]);

  useEffect(() => {
    if (resetKey === undefined || !widgetIdRef.current || !window.turnstile) {
      return;
    }
    setToken("");
    window.turnstile.reset(widgetIdRef.current);
  }, [resetKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className={className}>
      <input type="hidden" name={TURNSTILE_RESPONSE_FIELD} value={token} />
      <div ref={containerRef} />
    </div>
  );
}

/** True when the bot check is configured for this build. */
export function isTurnstileActive(): boolean {
  return Boolean(getTurnstileSiteKey());
}
