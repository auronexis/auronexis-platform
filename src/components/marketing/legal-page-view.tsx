import { LegalLayout } from "@/components/legal/legal-layout";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import type { LegalPageKey } from "@/lib/company/legal-content";
import { LEGAL_PAGES } from "@/lib/company/legal-content";

type LegalPageViewProps = {
  pageKey: LegalPageKey;
};

export function LegalPageView({ pageKey }: LegalPageViewProps) {
  return (
    <MarketingShell>
      <LegalLayout content={LEGAL_PAGES[pageKey]} showNav />
    </MarketingShell>
  );
}
