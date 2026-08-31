"use client";

import type { EInvoiceViewModel } from "@/lib/einvoice-viewer/types";

type TechnicalDetailsProps = {
  model: EInvoiceViewModel;
};

export function TechnicalDetails({ model }: TechnicalDetailsProps) {
  const t = model.technical;
  return (
    <details className="group rounded-md border border-border/80 print:hidden">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="text-muted group-open:rotate-90 transition-transform">
            ▸
          </span>
          Technische E-Rechnungsdaten
        </span>
      </summary>
      <dl className="grid gap-2 border-t border-border/70 px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Standard</dt>
          <dd className="text-foreground">{t.standardLabel}</dd>
        </div>
        <div>
          <dt className="text-muted">Profil</dt>
          <dd className="text-foreground">{t.profileLabel}</dd>
        </div>
        <div>
          <dt className="text-muted">Syntax</dt>
          <dd className="text-foreground">{t.syntaxLabel}</dd>
        </div>
        <div>
          <dt className="text-muted">Guideline</dt>
          <dd className="break-all text-foreground">{t.guidelineId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Invoice TypeCode</dt>
          <dd className="text-foreground">{t.documentTypeCode ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Currency</dt>
          <dd className="text-foreground">{t.currency ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Tax Category</dt>
          <dd className="text-foreground">
            {t.taxCategoryCodes.length > 0 ? t.taxCategoryCodes.join(", ") : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Tax exemption code</dt>
          <dd className="text-foreground">
            {t.exemptionReasonCodes.length > 0
              ? t.exemptionReasonCodes.join(", ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Unit code</dt>
          <dd className="text-foreground">
            {t.unitCodes.length > 0 ? t.unitCodes.join(", ") : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Seller VAT ID</dt>
          <dd className="text-foreground">{t.sellerVatId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Buyer VAT ID</dt>
          <dd className="text-foreground">{t.buyerVatId ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Official validation status</dt>
          <dd className="text-foreground">
            Not claimed by viewer parse (parsing ≠ official XSD/Schematron validation).
          </dd>
        </div>
      </dl>
    </details>
  );
}
