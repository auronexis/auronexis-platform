"use client";

import { useEffect, useRef, useState } from "react";

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
    };
    onTurnstileLoad?: () => void;
  }
}

type TurnstileFieldProps = {
  className?: string;
};

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileField({ className }: TurnstileFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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

    if (window.turnstile) {
      renderWidget();
      return;
    }

    window.onTurnstileLoad = renderWidget;

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => window.onTurnstileLoad?.();
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className={className}>
      <input type="hidden" name="cf-turnstile-response" value={token} />
      <div ref={containerRef} />
    </div>
  );
}
