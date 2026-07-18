"use client";

import Link from "next/link";
import { FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import type { CheckoutBlockState } from "@/lib/billing/checkout-block";
import { cn } from "@/lib/utils/cn";
import { focusRing, pressable, transitionInteractive } from "@/lib/ui/tokens";

type CheckoutBlockBannerProps = {
  checkoutBlock: CheckoutBlockState;
  canManage: boolean;
  portalAvailable: boolean;
  onOpenPortal?: () => void;
  isPortalPending?: boolean;
  showBackToBilling?: boolean;
  /** When false, hide portal CTA (e.g. no verified Paddle customer yet). */
  showPortalAction?: boolean;
};

export function CheckoutBlockBanner({
  checkoutBlock,
  canManage,
  portalAvailable,
  onOpenPortal,
  isPortalPending = false,
  showBackToBilling = true,
  showPortalAction = true,
}: CheckoutBlockBannerProps) {
  if (!checkoutBlock.blocked) {
    return null;
  }

  const invoiceLinkClassName = cn(
    "inline-flex items-center justify-center font-medium",
    transitionInteractive,
    focusRing,
    pressable,
    "h-10 gap-2 rounded-md px-4 text-sm",
    "border border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-interactive active:shadow-sm",
  );

  const message =
    checkoutBlock.code === "open_unpaid_invoice"
      ? "Checkout is blocked because an unpaid invoice is open."
      : (checkoutBlock.bannerMessage ?? checkoutBlock.message ?? "Checkout is currently blocked.");

  return (
    <FormAlert variant="warning">
      <p className="font-medium text-foreground">{message}</p>
      {checkoutBlock.message && checkoutBlock.message !== message ? (
        <p className="mt-1 text-sm">{checkoutBlock.message}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3">
        {checkoutBlock.hostedInvoiceUrl ? (
          <a
            href={checkoutBlock.hostedInvoiceUrl}
            target="_blank"
            rel="noreferrer"
            className={invoiceLinkClassName}
          >
            Open invoice
          </a>
        ) : null}
        {canManage && portalAvailable && showPortalAction && onOpenPortal ? (
          <Button type="button" variant="secondary" disabled={isPortalPending} onClick={onOpenPortal}>
            Open billing portal
          </Button>
        ) : null}
        {showBackToBilling ? (
          <Link
            href="/settings/billing"
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10"
          >
            Back to billing
          </Link>
        ) : null}
      </div>
    </FormAlert>
  );
}
