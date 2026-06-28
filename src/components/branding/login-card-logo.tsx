"use client";

import { useState } from "react";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { PLATFORM_NAME } from "@/lib/branding/defaults";

/** Login card brand — transparent PNG on light surface, text-only if assets fail. */
export function LoginCardLogo() {
  const [mode, setMode] = useState<"transparent" | "onLight" | "text">("transparent");

  if (mode === "text") {
    return (
      <p className="text-xl font-semibold tracking-tight text-navy-950">{PLATFORM_NAME}</p>
    );
  }

  const src =
    mode === "transparent"
      ? BRANDING_ASSETS.logoHorizontalTransparent
      : BRANDING_ASSETS.logoHorizontalOnLight;

  return (
    <img
      src={src}
      alt={`${PLATFORM_NAME} logo`}
      className="h-11 w-auto max-w-[min(100%,280px)] object-contain"
      onError={() => {
        if (mode === "transparent") {
          setMode("onLight");
          return;
        }
        setMode("text");
      }}
    />
  );
}
