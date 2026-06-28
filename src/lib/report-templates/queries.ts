import { createClient } from "@/lib/supabase/server";
import {
  TEMPLATE_LIST_SELECT,
  TEMPLATE_SELECT_COLUMNS,
  type ReportTemplateListItem,
} from "@/lib/report-templates/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ReportTemplate } from "@/types/database";

/** List all report templates for the current organization. */
export async function listReportTemplates(
  session: SessionContext,
): Promise<ReportTemplateListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select(TEMPLATE_LIST_SELECT)
    .eq("organization_id", session.organization.id)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReportTemplateListItem[];
}

/** Load a single report template by id within the current organization. */
export async function getReportTemplateById(
  session: SessionContext,
  templateId: string,
): Promise<ReportTemplateListItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select(TEMPLATE_LIST_SELECT)
    .eq("id", templateId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReportTemplateListItem | null) ?? null;
}

/** Load the default report template for the current organization, if any. */
export async function getDefaultReportTemplate(
  session: SessionContext,
): Promise<ReportTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select(TEMPLATE_SELECT_COLUMNS)
    .eq("organization_id", session.organization.id)
    .eq("is_default", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReportTemplate | null) ?? null;
}

/** Load a template record by id — used when generating scheduled reports. */
export async function getReportTemplateRecordById(
  session: SessionContext,
  templateId: string,
): Promise<ReportTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select(TEMPLATE_SELECT_COLUMNS)
    .eq("id", templateId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReportTemplate | null) ?? null;
}

/** Minimal template list for schedule and report selectors. */
export async function listReportTemplateOptions(
  session: SessionContext,
): Promise<Pick<ReportTemplate, "id" | "name" | "is_default">[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_templates")
    .select("id, name, is_default")
    .eq("organization_id", session.organization.id)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Pick<ReportTemplate, "id" | "name" | "is_default">[];
}
