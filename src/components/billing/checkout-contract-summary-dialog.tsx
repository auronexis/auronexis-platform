"use client";

import Link from "next/link";
import { useId } from "react";
import { formatMoneyFromCentsLocale } from "@/lib/i18n/format";
import {
  B2B_PURCHASE_ACKNOWLEDGEMENT_LABEL,
  type CheckoutContractSummary,
} from "@/lib/billing/contracting";
import { LEGAL_ROUTES } from "@/lib/company/company-links";
import { focusRing } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

export type CheckoutContractAcceptanceState = {
  termsAccepted: boolean;
  b2bEntrepreneurConfirmed: boolean;
  countryCode: string;
  vatId: string;
};

type CheckoutContractSummaryDialogProps = {
  open: boolean;
  summary: CheckoutContractSummary | null;
  acceptance: CheckoutContractAcceptanceState;
  onAcceptanceChange: (next: CheckoutContractAcceptanceState) => void;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
  error: string | null;
};

export function CheckoutContractSummaryDialog({
  open,
  summary,
  acceptance,
  onAcceptanceChange,
  onConfirm,
  onCancel,
  pending,
  error,
}: CheckoutContractSummaryDialogProps) {
  const titleId = useId();
  const termsId = useId();
  const b2bId = useId();
  const countryId = useId();
  const vatId = useId();

  if (!open || !summary) return null;

  const formattedPrice = formatMoneyFromCentsLocale(
    summary.amountMinor,
    summary.currency,
    "en",
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 sm:items-center"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-lg text-foreground"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          Confirm subscription contract
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Review the commercial terms before continuing to Mollie payment. Auroranexis is the
          seller; Mollie processes the payment as payment service provider.
        </p>

        <dl className="mt-4 space-y-2 rounded-md border border-border bg-surface-1 p-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Organization</dt>
            <dd className="font-medium text-foreground text-right">{summary.organizationName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="font-medium text-foreground">{summary.planName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Catalog price</dt>
            <dd className="font-medium text-foreground">
              {formattedPrice} / {summary.billingInterval}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Billing currency</dt>
            <dd className="font-medium text-foreground">{summary.currency}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Billing</dt>
            <dd className="font-medium text-foreground text-right">{summary.recurringLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Seller</dt>
            <dd className="font-medium text-foreground">{summary.sellerName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Payment provider</dt>
            <dd className="font-medium text-foreground">{summary.pspName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Tax status</dt>
            <dd className="font-medium text-foreground text-right">{summary.taxOutcomeLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Terms version</dt>
            <dd className="font-medium text-foreground">{summary.termsVersion}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">DPA version</dt>
            <dd className="font-medium text-foreground">{summary.dpaVersion}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label htmlFor={countryId} className="block text-sm font-medium text-foreground">
              Billing country
            </label>
            <select
              id={countryId}
              value={acceptance.countryCode}
              onChange={(event) =>
                onAcceptanceChange({ ...acceptance, countryCode: event.target.value })
              }
              className={cn(
                "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground [&>option]:bg-background [&>option]:text-foreground",
                focusRing,
              )}
            >
              <option value="DE">Germany (DE)</option>
              <option value="AT">Austria (AT)</option>
              <option value="NL">Netherlands (NL)</option>
              <option value="FR">France (FR)</option>
              <option value="BE">Belgium (BE)</option>
              <option value="OTHER">Other / outside listed EU</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Self-serve checkout currently completes for Germany domestic B2B. Other countries may
              require manual review. Country must match organization billing identity — not browser
              locale.
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor={vatId} className="block text-sm font-medium text-foreground">
              VAT ID (optional for DE; required for other EU)
            </label>
            <input
              id={vatId}
              type="text"
              autoComplete="off"
              value={acceptance.vatId}
              onChange={(event) =>
                onAcceptanceChange({ ...acceptance, vatId: event.target.value })
              }
              placeholder="DE123456789"
              className={cn(
                "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground",
                focusRing,
              )}
            />
            <p className="text-xs text-muted-foreground">
              Format is checked server-side. Official VIES validation may still be required before
              cross-border self-serve checkout is allowed.
            </p>
          </div>

          <label htmlFor={b2bId} className="flex items-start gap-3 text-sm text-foreground">
            <input
              id={b2bId}
              type="checkbox"
              checked={acceptance.b2bEntrepreneurConfirmed}
              onChange={(event) =>
                onAcceptanceChange({
                  ...acceptance,
                  b2bEntrepreneurConfirmed: event.target.checked,
                })
              }
              className={cn("mt-1 h-4 w-4 rounded border-border", focusRing)}
            />
            <span>{B2B_PURCHASE_ACKNOWLEDGEMENT_LABEL}</span>
          </label>

          <label htmlFor={termsId} className="flex items-start gap-3 text-sm text-foreground">
            <input
              id={termsId}
              type="checkbox"
              checked={acceptance.termsAccepted}
              onChange={(event) =>
                onAcceptanceChange({ ...acceptance, termsAccepted: event.target.checked })
              }
              className={cn("mt-1 h-4 w-4 rounded border-border", focusRing)}
            />
            <span>
              I accept the{" "}
              <Link href={LEGAL_ROUTES.terms} className="font-medium text-primary underline">
                Terms
              </Link>
              , acknowledge the{" "}
              <Link href={LEGAL_ROUTES.privacy} className="font-medium text-primary underline">
                Privacy Policy
              </Link>
              , and the{" "}
              <Link
                href={LEGAL_ROUTES.dataProcessingAgreement}
                className="font-medium text-primary underline"
              >
                Data Processing Agreement
              </Link>
              . See also{" "}
              <Link href={LEGAL_ROUTES.refundPolicy} className="font-medium text-primary underline">
                Refund and Cancellation
              </Link>
              .
            </span>
          </label>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground",
              focusRing,
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50",
              focusRing,
            )}
          >
            {pending ? "Starting checkout…" : "Continue to Mollie"}
          </button>
        </div>
      </div>
    </div>
  );
}
