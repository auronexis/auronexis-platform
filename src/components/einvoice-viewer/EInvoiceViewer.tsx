"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { InvoiceHeader } from "@/components/einvoice-viewer/InvoiceHeader";
import { InvoiceLineItems } from "@/components/einvoice-viewer/InvoiceLineItems";
import { InvoiceMetadata } from "@/components/einvoice-viewer/InvoiceMetadata";
import { InvoiceTotals } from "@/components/einvoice-viewer/InvoiceTotals";
import { PartyCard } from "@/components/einvoice-viewer/PartyCard";
import { TaxSummary } from "@/components/einvoice-viewer/TaxSummary";
import { TechnicalDetails } from "@/components/einvoice-viewer/TechnicalDetails";
import {
  consistencyWarnings,
  unsupportedProfileBanner,
} from "@/lib/einvoice-viewer/validation-display";
import type { EInvoiceViewModel } from "@/lib/einvoice-viewer/types";
import { focusRing } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type EInvoiceViewerProps = {
  model: EInvoiceViewModel;
  downloadHref?: string;
  className?: string;
};

export function EInvoiceViewer({ model, downloadHref, className }: EInvoiceViewerProps) {
  const [showXml, setShowXml] = useState(false);
  const xmlPanelId = useId();
  const warnings = consistencyWarnings(model);
  const unsupported = unsupportedProfileBanner(model);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          Drucken
        </Button>
        {downloadHref ? (
          <a
            href={downloadHref}
            download
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-muted/10",
              focusRing,
            )}
          >
            XML herunterladen
          </a>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={showXml}
          aria-controls={xmlPanelId}
          onClick={() => setShowXml((v) => !v)}
        >
          {showXml ? "XML ausblenden" : "XML anzeigen"}
        </Button>
      </div>

      {model.isDemo ? (
        <div
          role="status"
          className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-foreground"
        >
          <p className="font-semibold tracking-wide">TEST / DEMO</p>
          <p>KEINE RECHTSGÜLTIGE RECHNUNG</p>
        </div>
      ) : null}

      {unsupported ? (
        <div
          role="status"
          className="rounded-md border border-amber-700/40 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-950/40"
        >
          <p className="font-semibold">{unsupported}</p>
          <p className="mt-1 text-muted">
            Guideline: {model.technical.guidelineId ?? "—"}
          </p>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-amber-700/30 bg-amber-50/70 px-4 py-3 text-sm dark:bg-amber-950/20">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      <article className="rounded-lg border border-border bg-background px-6 py-8 shadow-sm print:border-0 print:shadow-none print:px-0">
        <InvoiceHeader model={model} />

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <PartyCard title="Aussteller" party={model.seller} />
          <PartyCard title="Rechnungsempfänger" party={model.buyer} />
        </div>

        <div className="mt-8">
          <InvoiceMetadata model={model} />
        </div>

        <div className="mt-8">
          <InvoiceLineItems model={model} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(240px,20rem)] lg:items-start">
          <TaxSummary model={model} />
          <InvoiceTotals model={model} />
        </div>

        {model.notes.length > 0 ? (
          <section className="mt-8 border-t border-border pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Hinweise
            </h2>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {model.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      <TechnicalDetails model={model} />

      {showXml ? (
        <section
          id={xmlPanelId}
          className="rounded-md border border-border bg-surface/50 print:hidden"
        >
          <h2 className="border-b border-border px-4 py-3 text-sm font-medium">
            Raw XML (exact input bytes)
          </h2>
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-all px-4 py-3 text-xs text-foreground">
            {model.rawXml}
          </pre>
        </section>
      ) : null}
    </div>
  );
}

type EInvoiceViewerErrorProps = {
  title: string;
  detail?: string | null;
};

export function EInvoiceViewerError({ title, detail }: EInvoiceViewerErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/40 bg-danger/10 px-4 py-6 text-foreground"
    >
      <h1 className="text-lg font-semibold">{title}</h1>
      {detail ? <p className="mt-2 text-sm text-muted">{detail}</p> : null}
    </div>
  );
}
