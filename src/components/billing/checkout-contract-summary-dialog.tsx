"use client";

import Link from "next/link";
import { useId } from "react";
import { formatMoneyFromCentsLocale } from "@/lib/i18n/format";
import type { CheckoutContractSummary } from "@/lib/billing/contracting";
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-950">
          Confirm subscription contract
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Review the commercial terms before continuing to Mollie payment. Auroranexis is the
          seller; Mollie processes the payment.
        </p>

        <dl className="mt-4 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Plan</dt>
            <dd className="font-medium text-slate-950">{summary.planName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Price (VAT-inclusive list)</dt>
            <dd className="font-medium text-slate-950">
              {formattedPrice} / {summary.billingInterval}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Billing currency</dt>
            <dd className="font-medium text-slate-950">{summary.currency}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Seller</dt>
            <dd className="font-medium text-slate-950">{summary.sellerName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Payment provider</dt>
            <dd className="font-medium text-slate-950">{summary.pspName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">Terms version</dt>
            <dd className="font-medium text-slate-950">{summary.termsVersion}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label htmlFor={countryId} className="block text-sm font-medium text-slate-900">
              Billing country
            </label>
            <select
              id={countryId}
              value={acceptance.countryCode}
              onChange={(event) =>
                onAcceptanceChange({ ...acceptance, countryCode: event.target.value })
              }
              className={cn(
                "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950",
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
            <p className="text-xs text-slate-600">
              Self-serve checkout currently completes for Germany domestic B2B. Other countries may
              require manual review.
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor={vatId} className="block text-sm font-medium text-slate-900">
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
                "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950",
                focusRing,
              )}
            />
          </div>

          <label htmlFor={b2bId} className="flex items-start gap-3 text-sm text-slate-800">
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
              className={cn("mt-1 h-4 w-4 rounded border-slate-300", focusRing)}
            />
            <span>
              I confirm that I am acting as an entrepreneur (§14 BGB) and not as a consumer.
            </span>
          </label>

          <label htmlFor={termsId} className="flex items-start gap-3 text-sm text-slate-800">
            <input
              id={termsId}
              type="checkbox"
              checked={acceptance.termsAccepted}
              onChange={(event) =>
                onAcceptanceChange({ ...acceptance, termsAccepted: event.target.checked })
              }
              className={cn("mt-1 h-4 w-4 rounded border-slate-300", focusRing)}
            />
            <span>
              I accept the{" "}
              <Link href={LEGAL_ROUTES.terms} className="font-medium text-blue-700 underline">
                Terms
              </Link>{" "}
              and acknowledge the{" "}
              <Link
                href={LEGAL_ROUTES.dataProcessingAgreement}
                className="font-medium text-blue-700 underline"
              >
                Data Processing Agreement summary
              </Link>
              .
            </span>
          </label>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800",
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
              "inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50",
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
