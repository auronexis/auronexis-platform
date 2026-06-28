import type { Metadata } from "next";
import { OutreachTemplateList } from "@/components/sales/outreach-template-list";
import { PageHeader } from "@/components/layout/page-header";
import { listOutreachTemplates } from "@/lib/sales/outreach-templates";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Outreach Templates",
};

export default async function OutreachTemplatesPage() {
  await requireModuleAccess("sales");
  const templates = listOutreachTemplates();

  return (
    <>
      <PageHeader
        module="sales"
        title="Outreach templates"
        description="Cold and warm outreach, LinkedIn DMs, email sequences, follow-ups, proposals, and win-back."
      />
      <OutreachTemplateList templates={templates} />
    </>
  );
}
