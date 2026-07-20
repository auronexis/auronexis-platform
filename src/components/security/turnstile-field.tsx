"use client";

import { useEffect, useRef, useState } from "react";
import {
  TURNSTILE_MISCONFIGURED_ERROR,
  TURNSTILE_RESPONSE_FIELD,
  readTurnstileSiteKeyFromEnv,
} from "@/lib/security/turnstile-shared";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove?: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

type TurnstileFieldProps = {
  className?: string;
  onTokenChange?: (token: string) => void;
};

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";

export function TurnstileField({ className, onTokenChange }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const siteKey = readTurnstileSiteKeyFromEnv();

  useEffect(() => {
    onTokenChange?.(token);
  }, [token, onTokenChange]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return;
    }

    function renderWidget() {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current || !siteKey) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        callback: (value) => setToken(value),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    }

    const previousOnLoad = window.onTurnstileLoad;
    window.onTurnstileLoad = () => {
      previousOnLoad?.();
      renderWidget();
    };

    if (window.turnstile) {
      renderWidget();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        if (typeof window.turnstile.remove === "function") {
          window.turnstile.remove(widgetIdRef.current);
        } else {
          window.turnstile.reset(widgetIdRef.current);
        }
      }
      widgetIdRef.current = null;
      setToken("");
    };
  }, [siteKey]);

  if (!siteKey) {
    if (process.env.NODE_ENV === "production") {
      return (
        <p role="alert" className={className ? `${className} text-sm text-red-700` : "text-sm text-red-700"}>
          {TURNSTILE_MISCONFIGURED_ERROR}
        </p>
      );
    }
    return null;
  }

  return (
    <div className={className}>
      <input type="hidden" name={TURNSTILE_RESPONSE_FIELD} value={token} />
      <div ref={containerRef} />
    </div>
  );
}

export function isTurnstileSiteKeyAvailable(): boolean {
  return Boolean(readTurnstileSiteKeyFromEnv());
}
