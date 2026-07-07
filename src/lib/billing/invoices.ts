import "server-only";

import type { BillingEventRecord, CustomerInvoiceView } from "@/lib/billing/types";
import { formatBillingDate, formatBillingDateTime } from "@/lib/billing/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type Stripe from "stripe";

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  paid: "Paid",
  uncollectible: "Uncollectible",
  void: "Void",
};

function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}

function mapInvoiceRow(row: {
  id: string;
  stripe_invoice_id: string;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  due_at: string | null;
  paid_at: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
}): CustomerInvoiceView {
  const periodStart = formatBillingDate(row.period_start);
  const periodEnd = formatBillingDate(row.period_end);

  return {
    id: row.id,
    stripeInvoiceId: row.stripe_invoice_id,
    status: row.status,
    statusLabel: INVOICE_STATUS_LABELS[row.status] ?? row.status,
    amountDue: row.amount_due,
    amountPaid: row.amount_paid,
    currency: row.currency,
    formattedAmount: formatMoney(row.amount_due || row.amount_paid, row.currency),
    dueAt: row.due_at,
    paidAt: row.paid_at,
    invoicePdfUrl: row.invoice_pdf_url,
    hostedInvoiceUrl: row.hosted_invoice_url,
    periodLabel: periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : null,
    isFuture: row.status === "draft",
  };
}

export async function listCustomerInvoices(
  session: SessionContext,
  limit = 24,
): Promise<CustomerInvoiceView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_invoices")
    .select("*")
    .eq("organization_id", session.organization.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
    mapInvoiceRow(row as never),
  );
}

export async function syncCustomerInvoiceFromStripe(
  organizationId: string,
  invoice: Stripe.Invoice,
): Promise<void> {
  const admin = createAdminClient();
  const payload = {
    organization_id: organizationId,
    stripe_invoice_id: invoice.id,
    stripe_customer_id:
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null,
    status: invoice.status ?? "draft",
    amount_due: invoice.amount_due ?? 0,
    amount_paid: invoice.amount_paid ?? 0,
    currency: invoice.currency ?? "eur",
    due_at: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    paid_at:
      invoice.status === "paid" && invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
    invoice_pdf_url: invoice.invoice_pdf ?? null,
    hosted_invoice_url: invoice.hosted_invoice_url ?? null,
    period_start: invoice.period_start
      ? new Date(invoice.period_start * 1000).toISOString()
      : null,
    period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
  };

  const { error } = await admin
    .from("customer_invoices")
    .upsert(payload as never, { onConflict: "stripe_invoice_id" });

  if (error) {
    console.error("[billing] invoice sync failed:", error.message);
  }
}

export async function recordBillingEvent(input: BillingEventRecord): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("billing_events").insert({
    organization_id: input.organizationId,
    event_type: input.eventType,
    stripe_event_id: input.stripeEventId ?? null,
    payload: input.payload ?? {},
  } as never);

  if (error) {
    if (error.code === "23505") {
      return;
    }
    console.error("[billing] failed to record billing event:", error.message);
  }
}

const IGNORED_INVOICE_EVENT = "billing_maintenance.invoice_ignored";

/** Stripe invoice IDs marked ignored by admins for checkout diagnostics. */
export async function listIgnoredStripeInvoiceIds(organizationId: string): Promise<Set<string>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("billing_events")
    .select("payload")
    .eq("organization_id", organizationId)
    .eq("event_type", IGNORED_INVOICE_EVENT)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("[billing] ignored invoice lookup failed:", error.message);
    return new Set();
  }

  const ignored = new Set<string>();

  for (const row of (data ?? []) as Array<{ payload: Record<string, unknown> | null }>) {
    const stripeInvoiceId = row.payload?.stripeInvoiceId;
    if (typeof stripeInvoiceId === "string" && stripeInvoiceId.trim()) {
      ignored.add(stripeInvoiceId.trim());
    }
  }

  return ignored;
}

export async function countCustomerInvoices(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("customer_invoices")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function countRecentBillingEvents(organizationId: string, days = 7): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("billing_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);

  if (error) {
    return 0;
  }
  return count ?? 0;
}
