import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SalesLeadDetail } from "@/components/sales/sales-lead-detail";
import { getSalesLead, listLeadActivities } from "@/lib/sales/queries";
import { requireSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Lead Detail",
};

type LeadDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SalesLeadDetailPage({ params }: LeadDetailPageProps) {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const { id } = await params;
  const [lead, activities] = await Promise.all([
    getSalesLead(session, id),
    listLeadActivities(session, id),
  ]);

  if (!lead) {
    notFound();
  }

  const canManage = canAccessModule(session.role, "sales", "update");

  return (
    <>
      <Link href="/sales/leads" className="mb-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to leads
      </Link>
      <SalesLeadDetail lead={lead} activities={activities} canManage={canManage} />
    </>
  );
}
