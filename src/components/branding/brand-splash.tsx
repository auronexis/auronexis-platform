"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { BRANDING_ASSETS } from "@/lib/branding/assets";

type BrandSplashProps = {
  fullScreen?: boolean;
  className?: string;
  message?: string;
};

/** Dark loading / sign-out splash — logo + message with inline styles so colors cannot be overridden. */
export function BrandSplash({
  fullScreen = false,
  className,
  message = "Loading workspace...",
}: BrandSplashProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div
      className={className}
      style={{
        minHeight: fullScreen ? "100vh" : "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        padding: "16px",
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div
        style={{
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.05)",
          padding: "32px 40px",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
        }}
      >
        {logoFailed ? (
          <div
            style={{
              fontSize: "24px",
              lineHeight: "32px",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "#ffffff",
            }}
          >
            Auroranexis
          </div>
        ) : (
          <img
            src={BRANDING_ASSETS.logoHorizontalTransparent}
            alt="Auroranexis"
            onError={() => setLogoFailed(true)}
            style={{
              display: "block",
              margin: "0 auto",
              height: "48px",
              width: "auto",
              maxWidth: "240px",
              objectFit: "contain",
              opacity: 1,
            }}
          />
        )}
        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            lineHeight: "20px",
            color: "#cbd5e1",
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

/** Full-screen splash while sign-out server action is pending. */
export function SignOutPendingSplash() {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      <BrandSplash fullScreen message="Signing out..." />
    </div>
  );
}
