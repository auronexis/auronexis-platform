import { ClickableRow } from "@/components/ui/clickable-row";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableEmpty,
  AuroraTableHead,
  AuroraTableHeaderCell,
} from "@/components/ui/table";
import type { ReportTemplateListItem } from "@/lib/report-templates/types";
import { formatTemplateDate } from "@/lib/report-templates/types";
import { linkText } from "@/lib/ui/tokens";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type ReportTemplateListProps = {
  templates: ReportTemplateListItem[];
  canManage: boolean;
};

export function ReportTemplateList({ templates, canManage }: ReportTemplateListProps) {
  if (templates.length === 0) {
    return (
      <AuroraTableEmpty
        title="No templates created yet"
        description="Build reusable report content to speed up drafting and scheduled delivery."
        action={
          canManage ? (
            <Link href="/reports/templates/new" className={cn(linkText, "text-sm font-medium")}>
              Create template
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Template</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Default</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Created by</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Updated</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {templates.map((template) => (
            <ClickableRow
              key={template.id}
              href={`/reports/templates/${template.id}`}
              ariaLabel={`Open template ${template.name}`}
            >
              <AuroraTableCell>
                <span className="font-semibold text-foreground">{template.name}</span>
                {template.description ? (
                  <p className="mt-1 text-sm text-muted">{template.description}</p>
                ) : null}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                {template.is_default ? (
                  <span className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
                    Default
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {template.users?.full_name ?? "—"}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatTemplateDate(template.updated_at)}
              </AuroraTableCell>
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
