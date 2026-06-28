import type { KnowledgeHealthScore, KnowledgeRecommendation } from "@/lib/ai/knowledge/types";

type KnowledgeHealthCardProps = {
  health: KnowledgeHealthScore;
  recommendations: KnowledgeRecommendation[];
};

export function KnowledgeHealthCard({ health, recommendations }: KnowledgeHealthCardProps) {
  const stats = [
    { label: "Coverage", value: `${health.coveragePercent}%` },
    { label: "Reports learned", value: health.reportsLearned },
    { label: "Incidents learned", value: health.incidentsLearned },
    { label: "Risks learned", value: health.risksLearned },
    { label: "Playbooks", value: health.playbooksGenerated },
    { label: "Articles", value: health.articlesCount },
  ];

  return (
    <section aria-labelledby="knowledge-health-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="knowledge-health-heading" className="text-lg font-semibold text-foreground">
            AI Knowledge Health
          </h2>
          <p className="text-sm text-muted">Score based on verified historical coverage.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/80 px-4 py-2 text-right">
          <p className="text-xs text-muted">Health score</p>
          <p className="text-2xl font-semibold text-foreground" aria-live="polite">
            {health.score}
            <span className="text-sm font-normal text-muted"> / 100</span>
          </p>
          <p className="text-xs font-medium text-foreground">{health.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface/80 px-4 py-3">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {health.gaps.length > 0 ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-foreground">Knowledge gaps</p>
          <ul className="mt-2 space-y-1 text-sm text-muted" role="list">
            {health.gaps.map((gap) => (
              <li key={gap.id}>{gap.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {recommendations.length > 0 ? (
        <div className="rounded-xl border border-border bg-surface/80 p-4">
          <p className="text-sm font-semibold text-foreground">Smart recommendations</p>
          <ul className="mt-3 space-y-2" role="list">
            {recommendations.slice(0, 4).map((item) => (
              <li key={item.id} className="text-sm text-foreground">
                {item.message}
                <span className="block text-xs text-muted">{item.evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
