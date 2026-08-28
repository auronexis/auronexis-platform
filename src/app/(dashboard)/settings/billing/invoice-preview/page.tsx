import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  buildPreviewSalesInvoice,
  resolvePreviewScenario,
  type PreviewSalesInvoicePlanKey,
  type PreviewSalesInvoiceScenario,
} from "@/lib/billing/sales-invoice-preview";
import { renderSalesInvoiceHtml } from "@/lib/billing/sales-invoice-render";

export const metadata: Metadata = {
  title: "Invoice Visual Acceptance",
  robots: { index: false, follow: false },
};

type InvoicePreviewPageProps = {
  searchParams: Promise<{ plan?: string; scenario?: string }>;
};

function resolvePreviewPlan(value: string | undefined): PreviewSalesInvoicePlanKey {
  return value === "professional" ? "professional" : "business";
}

const SCENARIO_LABELS: Record<PreviewSalesInvoiceScenario, string> = {
  de: "DE domestic",
  fr: "FR EU B2B RC",
  nl: "NL EU B2B RC",
  us: "US NON-EU B2B",
  ch: "CH NON-EU B2B",
  gb: "GB NON-EU B2B",
  jp: "JP NON-EU B2B",
  kr: "KR NON-EU B2B",
  ca: "CA NON-EU B2B",
  au: "AU NON-EU B2B",
};

export default async function InvoicePreviewPage({ searchParams }: InvoicePreviewPageProps) {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const planKey = resolvePreviewPlan(params.plan);
  const scenario = resolvePreviewScenario(params.scenario);
  const { invoice, sellerConfig } = buildPreviewSalesInvoice(planKey, scenario);
  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });

  const pdfHref = `/api/operator/sales-invoice/preview?plan=${planKey}&scenario=${scenario}&format=pdf`;

  return (
    <>
      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className="font-medium text-primary hover:underline">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <Link href="/settings/billing" className="font-medium text-primary hover:underline">
          Billing
        </Link>
        <span className="mx-2">/</span>
        <span>Invoice visual acceptance</span>
      </div>

      <PageHeader
        module="settings"
        eyebrow="Internal · TEST DOCUMENT"
        title="Sales invoice visual acceptance"
        description="Ephemeral in-memory test using the production sales invoice PDF renderer and tax engine. Not an invoice. No Mollie payment, no database writes, not shown in Billing history."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted">Plan:</span>
        <Link
          href={`/settings/billing/invoice-preview?plan=professional&scenario=${scenario}`}
          className={
            planKey === "professional"
              ? "font-semibold text-foreground underline"
              : "text-primary hover:underline"
          }
        >
          Professional (EUR)
        </Link>
        <Link
          href={`/settings/billing/invoice-preview?plan=business&scenario=${scenario}`}
          className={
            planKey === "business"
              ? "font-semibold text-foreground underline"
              : "text-primary hover:underline"
          }
        >
          Business (EUR)
        </Link>
        <span className="text-muted">·</span>
        <span className="text-muted">Scenario:</span>
        {(Object.keys(SCENARIO_LABELS) as PreviewSalesInvoiceScenario[]).map((key) => (
          <Link
            key={key}
            href={`/settings/billing/invoice-preview?plan=${planKey}&scenario=${key}`}
            className={
              scenario === key
                ? "font-semibold text-foreground underline"
                : "text-primary hover:underline"
            }
          >
            {SCENARIO_LABELS[key]}
          </Link>
        ))}
        <span className="text-muted">·</span>
        <a
          href={pdfHref}
          className="font-medium text-primary hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Open test PDF
        </a>
      </div>

      {sellerConfig.missingFields.length > 0 ? (
        <div
          className="mb-6 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          Seller fields missing from COMPANY_INFORMATION: {sellerConfig.missingFields.join(", ")}.
          Production invoice issuance remains blocked until complete.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/5">
        <iframe
          title={`Invoice visual acceptance ${invoice.invoiceNumber}`}
          srcDoc={html}
          className="min-h-[960px] w-full bg-white"
          sandbox=""
        />
      </div>
    </>
  );
}
