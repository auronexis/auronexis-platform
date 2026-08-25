"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { acceptAllConsent, hasConsentDecision, rejectNonEssentialConsent } from "@/lib/consent/storage";
import { LEGAL_ROUTES } from "@/lib/company";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { focusFirstElement, restoreFocus, trapFocus } from "@/lib/a11y/focus";
import { CookiePreferencesModal } from "@/components/consent/cookie-preferences-modal";

function isAuthenticatedShellMounted(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.getElementById("dashboard-root") || document.getElementById("portal-root"));
}

export function CookieConsentBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [authenticatedSurface, setAuthenticatedSurface] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    setVisible(!hasConsentDecision());
  }, []);

  useEffect(() => {
    setAuthenticatedSurface(isAuthenticatedShellMounted());
  }, [pathname]);

  useEffect(() => {
    if (!visible || showPreferences) return;

    previouslyFocused.current = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const frame = window.requestAnimationFrame(() => {
      focusFirstElement(dialog);
    });
    const releaseTrap = trapFocus(dialog);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        rejectNonEssentialConsent("banner");
        setVisible(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      releaseTrap();
      window.removeEventListener("keydown", onKeyDown);
      restoreFocus(previouslyFocused.current);
    };
  }, [visible, showPreferences]);

  if (!visible) return null;

  return (
    <>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-consent-surface={authenticatedSurface ? "authenticated" : "public"}
        className={cn(
          authenticatedSurface
            ? [
                "fixed z-50 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xl",
                "bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4",
                "sm:bottom-6 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm",
              ]
            : [
                "fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-surface/95 p-4",
                "pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur sm:p-5",
              ],
        )}
      >
        <div
          className={cn(
            authenticatedSurface
              ? "flex flex-col gap-4"
              : "mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
          )}
        >
          <div
            className={cn(
              "text-sm leading-relaxed text-muted",
              authenticatedSurface ? "max-w-none" : "max-w-2xl",
            )}
          >
            <p id={titleId} className="font-medium text-foreground">
              Privacy preferences
            </p>
            <p className="mt-1">
              We use essential cookies for authentication and security. Analytics and marketing tools load only if you
              accept them. Read our{" "}
              <Link href={LEGAL_ROUTES.cookies} className={cn("font-medium text-primary hover:underline", focusRing)}>
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link href={LEGAL_ROUTES.privacy} className={cn("font-medium text-primary hover:underline", focusRing)}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className={cn("flex flex-wrap gap-2", authenticatedSurface && "flex-col sm:flex-row")}>
            <button
              type="button"
              onClick={() => {
                rejectNonEssentialConsent("banner");
                setVisible(false);
              }}
              className={cn(
                "rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2",
                authenticatedSurface && "w-full sm:w-auto",
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
                authenticatedSurface && "w-full sm:w-auto",
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
                authenticatedSurface && "w-full sm:w-auto",
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
