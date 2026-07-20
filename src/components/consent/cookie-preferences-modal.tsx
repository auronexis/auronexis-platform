"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { LEGAL_ROUTES } from "@/lib/company";
import {
  getConsentPreferences,
  writeConsent,
  type ConsentPreferences,
} from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { focusFirstElement, restoreFocus, trapFocus } from "@/lib/a11y/focus";

type CookiePreferencesModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function CookiePreferencesModal({ open, onClose, onSaved }: CookiePreferencesModalProps) {
  const [prefs, setPrefs] = useState<ConsentPreferences>(getConsentPreferences());
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (open) setPrefs(getConsentPreferences());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const panel = panelRef.current;
    if (!panel) return;

    const frame = window.requestAnimationFrame(() => {
      focusFirstElement(panel);
    });
    const releaseTrap = trapFocus(panel);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      releaseTrap();
      window.removeEventListener("keydown", onKeyDown);
      restoreFocus(previouslyFocused.current);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          Cookie preferences
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-muted">
          Choose which optional tools may run. Essential cookies are always active. See{" "}
          <Link href={LEGAL_ROUTES.cookies} className={cn("text-primary hover:underline", focusRing)}>
            Cookie Policy
          </Link>
          .
        </p>

        <div className="mt-6 space-y-4">
          <label className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-4">
            <span>
              <span className="block text-sm font-medium text-foreground">Essential</span>
              <span className="mt-1 block text-xs text-muted">Authentication, security, and core functionality.</span>
            </span>
            <input type="checkbox" checked disabled className="mt-1" aria-label="Essential cookies always active" />
          </label>

          <label className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-4">
            <span>
              <span className="block text-sm font-medium text-foreground">Analytics</span>
              <span className="mt-1 block text-xs text-muted">
                Privacy-aware usage measurement (Plausible, Clarity, PostHog where enabled).
              </span>
            </span>
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
              className={cn("mt-1", focusRing)}
              aria-label="Analytics cookies"
            />
          </label>

          <label className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-4">
            <span>
              <span className="block text-sm font-medium text-foreground">Marketing</span>
              <span className="mt-1 block text-xs text-muted">
                Conversion measurement (GA4 / Google Ads where explicitly enabled).
              </span>
            </span>
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
              className={cn("mt-1", focusRing)}
              aria-label="Marketing cookies"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2",
              focusRing,
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              writeConsent(prefs, "modal");
              onSaved?.();
              onClose();
            }}
            className={cn(
              "rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
              focusRing,
            )}
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}

/** Button to reopen cookie preferences from footer or legal pages. */
export function CookiePreferencesButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("text-sm hover:underline", focusRing, className)}
      >
        Cookie preferences
      </button>
      <CookiePreferencesModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
