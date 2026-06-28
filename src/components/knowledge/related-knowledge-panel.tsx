import Link from "next/link";
import type { RelatedKnowledgePanel } from "@/lib/ai/knowledge/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type RelatedKnowledgePanelProps = {
  data: RelatedKnowledgePanel;
  className?: string;
};

function EntityList({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; href: string; excerpt: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
      <ul className="mt-2 space-y-2" role="list">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={cn(linkText, "text-sm font-medium")}>
              {item.title}
            </Link>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RelatedKnowledgePanelView({ data, className }: RelatedKnowledgePanelProps) {
  const hasContent =
    data.relatedReports.length > 0 ||
    data.relatedRisks.length > 0 ||
    data.relatedIncidents.length > 0 ||
    data.similarIssues.length > 0 ||
    data.recommendedArticles.length > 0;

  if (!hasContent) {
    return (
      <p className="text-sm text-muted" role="status">
        No related historical knowledge found for this entity yet.
      </p>
    );
  }

  return (
    <div className={cn("space-y-5", className)} aria-label="Related knowledge">
      <p className="text-sm text-muted">
        Confidence:{" "}
        <span className="font-semibold text-foreground">{data.confidence}%</span> based on verified
        organizational records.
      </p>

      <EntityList title="Related reports" items={data.relatedReports} />
      <EntityList title="Related risks" items={data.relatedRisks} />
      <EntityList title="Related incidents" items={data.relatedIncidents} />

      {data.similarIssues.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Similar issues
          </h3>
          <ul className="mt-2 space-y-2" role="list">
            {data.similarIssues.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className={cn(linkText, "text-sm font-medium")}>
                  {item.title}
                </Link>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.excerpt}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.previousResolutions.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Previous resolutions
          </h3>
          <ul className="mt-2 space-y-2 text-sm text-foreground" role="list">
            {data.previousResolutions.map((item) => (
              <li key={item.id}>{item.excerpt}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.recommendedArticles.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Recommended articles
          </h3>
          <ul className="mt-2 space-y-2" role="list">
            {data.recommendedArticles.map((article) => (
              <li key={article.id}>
                <p className="text-sm font-medium text-foreground">{article.title}</p>
                <p className="text-xs text-muted">{article.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
