import type { ReportTemplate } from "@/types/database";

export type ReportTemplateListItem = ReportTemplate & {
  users: { full_name: string } | null;
};

export const TEMPLATE_SELECT_COLUMNS =
  "id, organization_id, name, description, is_default, executive_summary_template, key_wins_template, key_risks_template, next_actions_template, created_by, created_at, updated_at";

export const TEMPLATE_LIST_SELECT = `
  ${TEMPLATE_SELECT_COLUMNS},
  users ( full_name )
`;

export type ReportTemplateContent = {
  executive_summary: string | null;
  key_wins: string | null;
  key_risks: string | null;
  next_actions: string | null;
};

/** Extract report body fields from a template record. */
export function applyReportTemplate(template: Pick<
  ReportTemplate,
  | "executive_summary_template"
  | "key_wins_template"
  | "key_risks_template"
  | "next_actions_template"
>): ReportTemplateContent {
  return {
    executive_summary: template.executive_summary_template,
    key_wins: template.key_wins_template,
    key_risks: template.key_risks_template,
    next_actions: template.next_actions_template,
  };
}

export function emptyReportTemplateContent(): ReportTemplateContent {
  return {
    executive_summary: null,
    key_wins: null,
    key_risks: null,
    next_actions: null,
  };
}

export function formatTemplateDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
