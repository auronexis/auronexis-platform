import { ConversionTracker } from "@/components/analytics/conversion-tracker";
import { LegalLayout } from "@/components/legal/legal-layout";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import type { LegalPageKey } from "@/lib/company/legal-content";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import {
  JsonLdScript,
  privacyPolicyJsonLd,
  termsOfServiceJsonLd,
  webPageJsonLd,
} from "@/lib/marketing/seo";

type LegalPageViewProps = {
  pageKey: LegalPageKey;
};

function legalJsonLd(pageKey: LegalPageKey) {
  const content = LEGAL_PAGES[pageKey];
  const title = content.title;
  const description = content.description;

  if (pageKey === "privacy") {
    return privacyPolicyJsonLd({ title, description });
  }
  if (pageKey === "terms") {
    return termsOfServiceJsonLd({ title, description });
  }

  const pathByKey: Partial<Record<LegalPageKey, string>> = {
    cookies: "/cookies",
    imprint: "/imprint",
    refundPolicy: "/refund-policy",
    securityPolicy: "/security-policy",
    subprocessors: "/subprocessors",
    dataProcessingAgreement: "/data-processing-agreement",
    acceptableUse: "/acceptable-use",
  };

  const path = pathByKey[pageKey];
  if (!path) {
    return null;
  }

  return webPageJsonLd({ title, description, path });
}

export function LegalPageView({ pageKey }: LegalPageViewProps) {
  const schema = legalJsonLd(pageKey);

  return (
    <MarketingShell>
      {schema ? <JsonLdScript data={schema} /> : null}
      <ConversionTracker event="legal_page_viewed" props={{ page: pageKey }} />
      <LegalLayout content={LEGAL_PAGES[pageKey]} showNav />
    </MarketingShell>
  );
}
