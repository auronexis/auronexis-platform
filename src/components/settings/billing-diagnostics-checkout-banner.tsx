"use client";

import { useState, useTransition } from "react";
import { CheckoutBlockBanner } from "@/components/billing/checkout-block-banner";
import { FormAlert } from "@/components/ui/form-alert";
import { createPortalSessionAction } from "@/lib/billing/actions";
import type { CheckoutBlockState } from "@/lib/billing/checkout-block";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";

type BillingDiagnosticsCheckoutBannerProps = {
  checkoutBlock: CheckoutBlockState;
};

export function BillingDiagnosticsCheckoutBanner({
  checkoutBlock,
}: BillingDiagnosticsCheckoutBannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPortalPending, startPortalTransition] = useTransition();

  const openPortal = () => {
    setError(null);
    startPortalTransition(async () => {
      const result = await createPortalSessionAction();
      if (result?.error) {
        setError(
          sanitizeBillingCustomerError(new Error(result.error), "Unable to open billing portal."),
        );
      }
    });
  };

  return (
    <div className="space-y-3">
      <CheckoutBlockBanner
        checkoutBlock={checkoutBlock}
        canManage
        portalAvailable
        onOpenPortal={openPortal}
        isPortalPending={isPortalPending}
        showBackToBilling
      />
      {error ? <FormAlert variant="warning">{error}</FormAlert> : null}
    </div>
  );
}
