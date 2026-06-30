"use client";

import { useFormStatus } from "react-dom";

type BrandSplashProps = {
  fullScreen?: boolean;
  className?: string;
  message?: string;
};

/** Dark loading / sign-out splash — text only, inline styles so colors cannot be overridden. */
export function BrandSplash({
  fullScreen = false,
  className,
  message = "Loading workspace...",
}: BrandSplashProps) {
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
        <div
          style={{
            fontSize: "30px",
            lineHeight: "36px",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "#ffffff",
          }}
        >
          Auroranexis
        </div>
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
