"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { acceptAllConsent, hasConsentDecision, rejectNonEssentialConsent } from "@/lib/consent/storage";
import { LEGAL_ROUTES } from "@/lib/company";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { CookiePreferencesModal } from "@/components/consent/cookie-preferences-modal";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    setVisible(!hasConsentDecision());
  }, []);

  if (!visible) return null;

  return (
    <>
      <div
        role="dialog"
        aria-label="Cookie consent"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-surface/95 p-4 shadow-lg backdrop-blur sm:p-5"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl text-sm leading-relaxed text-muted">
            <p className="font-medium text-foreground">Privacy preferences</p>
            <p className="mt-1">
              We use essential cookies for authentication and security. Analytics and marketing tools load only if you
              accept them. Read our{" "}
              <Link href={LEGAL_ROUTES.cookies} className="font-medium text-primary hover:underline">
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link href={LEGAL_ROUTES.privacy} className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                rejectNonEssentialConsent("banner");
                setVisible(false);
              }}
              className={cn(
                "rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2",
                focusRing,
              )}
            >
              Reject non-essential
            </button>
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className={cn(
                "rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2",
                focusRing,
              )}
            >
              Manage
            </button>
            <button
              type="button"
              onClick={() => {
                acceptAllConsent("banner");
                setVisible(false);
              }}
              className={cn(
                "rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
                focusRing,
              )}
            >
              Accept all
            </button>
          </div>
        </div>
      </div>

      <CookiePreferencesModal
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSaved={() => {
          setShowPreferences(false);
          setVisible(false);
        }}
      />
    </>
  );
}
