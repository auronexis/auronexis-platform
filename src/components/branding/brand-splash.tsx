"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";

type BrandSplashProps = {
  fullScreen?: boolean;
  className?: string;
  message?: string;
};

/** Dark loading / sign-out splash — text only, hardcoded light text on dark background. */
export function BrandSplash({
  fullScreen = false,
  className,
  message = "Loading workspace...",
}: BrandSplashProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-slate-950 px-4",
        fullScreen ? "min-h-screen" : "min-h-[50vh] py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 px-10 py-8 text-center shadow-2xl backdrop-blur">
        <div className="text-3xl font-bold tracking-tight !text-white">Auroranexis</div>
        <p className="mt-3 text-sm !text-slate-300">{message}</p>
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
