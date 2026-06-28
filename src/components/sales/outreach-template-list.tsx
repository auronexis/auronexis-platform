import type { OutreachTemplate } from "@/lib/sales/outreach-templates";

type OutreachTemplateListProps = {
  templates: OutreachTemplate[];
};

export function OutreachTemplateList({ templates }: OutreachTemplateListProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {templates.map((template) => (
        <article key={template.key} className="aurora-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">{template.title}</h3>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted">{template.channel}</p>
            </div>
            {template.cadenceStep ? (
              <span className="rounded-full border border-border-subtle px-2 py-0.5 text-xs text-muted">
                Day {template.cadenceStep}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">{template.subject}</p>
          <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-border-subtle bg-surface-1 p-3 text-xs text-muted">
            {template.body}
          </pre>
        </article>
      ))}
    </div>
  );
}
