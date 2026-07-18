import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getStoredOrganizationCurrency } from "@/lib/i18n";
import { canAccessModule } from "@/lib/rbac/permissions";
import { getSalesLead, getSalesProposal } from "@/lib/sales/queries";
import { mergeProposalContent } from "@/lib/sales/proposal-generator";
import { buildProposalExportFilename, generateProposalPdf } from "@/lib/sales/proposal-pdf";
import { createClient } from "@/lib/supabase/server";

type ExportRouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: ExportRouteContext): Promise<Response> {
  const session = await requireSession();
  if (!canAccessModule(session.role, "sales", "read")) {
    return new Response("Forbidden", { status: 403 });
  }

  const currency = getStoredOrganizationCurrency(session.organization);
  const { id } = await context.params;
  const proposal = await getSalesProposal(session, id);
  if (!proposal) notFound();

  const lead = await getSalesLead(session, proposal.lead_id);
  const content = mergeProposalContent(
    proposal,
    lead ?? {
      contact_name: "Contact",
      company_name: "Company",
      pain_points: null,
      potential_mrr: Number(proposal.mrr_proposed),
      mrr_estimate: Number(proposal.mrr_proposed),
      employee_count: null,
    },
    currency,
  );

  const pdf = await generateProposalPdf(content, currency);
  const filename = buildProposalExportFilename(lead?.company_name ?? "customer");

  const supabase = await createClient();
  await supabase
    .from("sales_proposals")
    .update({ pdf_generated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .eq("organization_id", session.organization.id);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
