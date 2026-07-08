import Link from "next/link";
import type { ReactNode } from "react";
import {
  COMPANY_CONTACT,
  COMPANY_INFORMATION,
  formatAddressLines,
  formatBusinessFormDisplay,
  LEGAL_UI_LABELS,
} from "@/lib/company";
import { cn } from "@/lib/utils/cn";

type CompanyInformationCardProps = {
  className?: string;
  title?: string;
};

type InfoRowProps = {
  label: string;
  children: ReactNode;
};

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground/55">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed text-primary-foreground/80">{children}</dd>
    </div>
  );
}

/** Reusable company information block for legal pages — English labels only. */
export function CompanyInformationCard({
  className,
  title = "Company information",
}: CompanyInformationCardProps) {
  const addressLines = formatAddressLines();

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-5 sm:px-6 sm:py-6",
        className,
      )}
      aria-label={title}
    >
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <dl className="mt-4 space-y-4">
        <InfoRow label={LEGAL_UI_LABELS.company}>{COMPANY_INFORMATION.legalName}</InfoRow>
        <InfoRow label={LEGAL_UI_LABELS.owner}>{COMPANY_INFORMATION.owner}</InfoRow>
        <InfoRow label={LEGAL_UI_LABELS.businessForm}>{formatBusinessFormDisplay()}</InfoRow>
        <InfoRow label={LEGAL_UI_LABELS.address}>
          <span className="block whitespace-pre-line">
            {addressLines.join("\n")}
          </span>
        </InfoRow>
        <InfoRow label={LEGAL_UI_LABELS.phone}>
          <a href={`tel:${COMPANY_CONTACT.phone.replace(/\s/g, "")}`} className="hover:text-white">
            {COMPANY_CONTACT.phone}
          </a>
        </InfoRow>
        <InfoRow label={LEGAL_UI_LABELS.support}>
          <a href={`mailto:${COMPANY_CONTACT.supportEmail}`} className="hover:text-white">
            {COMPANY_CONTACT.supportEmail}
          </a>
        </InfoRow>
        <InfoRow label={LEGAL_UI_LABELS.legalPrivacy}>
          <a href={`mailto:${COMPANY_CONTACT.legalEmail}`} className="hover:text-white">
            {COMPANY_CONTACT.legalEmail}
          </a>
        </InfoRow>
        <InfoRow label={LEGAL_UI_LABELS.vatId}>{COMPANY_INFORMATION.vatId}</InfoRow>
        <InfoRow label={LEGAL_UI_LABELS.website}>
          <Link href={COMPANY_INFORMATION.website} className="hover:text-white">
            {COMPANY_INFORMATION.website}
          </Link>
        </InfoRow>
      </dl>
    </section>
  );
}
