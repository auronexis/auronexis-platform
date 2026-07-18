import type { AppLocale } from "@/lib/i18n/types";

export type InvoiceTranslations = {
  title: string;
  number: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  total: string;
  tax: string;
  description: string;
  payment: string;
  contact: string;
  footer: string;
  support: string;
  thankYou: string;
  latestInvoices: string;
  latestInvoicesDescription: string;
  totalInvoices: string;
  paid: string;
  openUnpaid: string;
  noInvoicesSynced: string;
  invoice: string;
  status: string;
  amountDue: string;
  amountPaid: string;
  period: string;
  duePaid: string;
  actions: string;
  downloadPdf: string;
  openInvoice: string;
  showingLatest: string;
  manageInPortal: string;
  statusDraft: string;
  statusOpen: string;
  statusPaid: string;
  statusOpenUnpaid: string;
  statusUpcoming: string;
  statusUncollectible: string;
  statusVoid: string;
  paidAt: string;
  dueAt: string;
  emDash: string;
};

const INVOICE_TRANSLATIONS: Record<AppLocale, InvoiceTranslations> = {
  de: {
    title: "Rechnung",
    number: "Rechnungsnummer",
    issueDate: "Rechnungsdatum",
    dueDate: "Fälligkeitsdatum",
    subtotal: "Zwischensumme",
    total: "Gesamtbetrag",
    tax: "Steuer",
    description: "Beschreibung",
    payment: "Zahlung",
    contact: "Kontakt",
    footer: "Vielen Dank für Ihr Vertrauen.",
    support: "Support",
    thankYou: "Vielen Dank für Ihre Zahlung.",
    latestInvoices: "Aktuelle Rechnungen",
    latestInvoicesDescription:
      "Paddle-Rechnungshistorie. Steuerbeträge werden von Paddle als Merchant of Record bereitgestellt.",
    totalInvoices: "Rechnungen gesamt",
    paid: "Bezahlt",
    openUnpaid: "Offen / unbezahlt",
    noInvoicesSynced:
      "Noch keine Rechnungen verfügbar.",
    invoice: "Rechnung",
    status: "Status",
    amountDue: "Fälliger Betrag",
    amountPaid: "Bezahlter Betrag",
    period: "Zeitraum",
    duePaid: "Fällig / bezahlt",
    actions: "Aktionen",
    downloadPdf: "Rechnungs-PDF herunterladen",
    openInvoice: "Rechnung öffnen",
    showingLatest: "Die letzten {limit} Rechnungen werden angezeigt.",
    manageInPortal:
      "Verwalten Sie Abonnement und Zahlungsmethoden im Paddle-Kundenportal.",
    statusDraft: "Entwurf",
    statusOpen: "Offen",
    statusPaid: "Bezahlt",
    statusOpenUnpaid: "Offen / unbezahlt",
    statusUpcoming: "Bevorstehend",
    statusUncollectible: "Uneinbringlich",
    statusVoid: "Storniert",
    paidAt: "Bezahlt am",
    dueAt: "Fällig am",
    emDash: "—",
  },
  en: {
    title: "Invoice",
    number: "Invoice number",
    issueDate: "Issue date",
    dueDate: "Due date",
    subtotal: "Subtotal",
    total: "Total",
    tax: "Tax",
    description: "Description",
    payment: "Payment",
    contact: "Contact",
    footer: "Thank you for your business.",
    support: "Support",
    thankYou: "Thank you for your payment.",
    latestInvoices: "Latest invoices",
    latestInvoicesDescription:
      "Paddle billing history. Tax amounts are provided by Paddle as Merchant of Record.",
    totalInvoices: "Total invoices",
    paid: "Paid",
    openUnpaid: "Open / unpaid",
    noInvoicesSynced:
      "No invoices are available yet.",
    invoice: "Invoice",
    status: "Status",
    amountDue: "Amount due",
    amountPaid: "Amount paid",
    period: "Period",
    duePaid: "Due / paid",
    actions: "Actions",
    downloadPdf: "Download invoice PDF",
    openInvoice: "Open invoice",
    showingLatest: "Showing the latest {limit} invoices.",
    manageInPortal:
      "Manage your subscription and payment methods in the Paddle customer portal.",
    statusDraft: "Draft",
    statusOpen: "Open",
    statusPaid: "Paid",
    statusOpenUnpaid: "Open / unpaid",
    statusUpcoming: "Upcoming",
    statusUncollectible: "Uncollectible",
    statusVoid: "Void",
    paidAt: "Paid",
    dueAt: "Due",
    emDash: "—",
  },
};

export function getInvoiceTranslations(locale: AppLocale): InvoiceTranslations {
  return INVOICE_TRANSLATIONS[locale];
}

export function getInvoiceStatusLabel(
  status: string,
  locale: AppLocale,
): string {
  const t = getInvoiceTranslations(locale);
  switch (status) {
    case "draft":
      return t.statusDraft;
    case "open":
      return t.statusOpen;
    case "paid":
      return t.statusPaid;
    case "uncollectible":
      return t.statusUncollectible;
    case "void":
      return t.statusVoid;
    default:
      return status;
  }
}
