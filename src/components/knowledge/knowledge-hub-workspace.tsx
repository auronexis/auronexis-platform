"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  BookOpen,
  FileText,
  Layers,
  Lightbulb,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Search,
} from "lucide-react";
import { KnowledgeHealthCard } from "@/components/knowledge/knowledge-health-card";
import { AIErrorAlert } from "@/components/ai/ai-error-alert";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  answerKnowledgeQuestionServerAction,
  generateKnowledgeArticleServerAction,
  generatePlaybookServerAction,
  searchKnowledgeServerAction,
} from "@/lib/ai/knowledge/action";
import type {
  KnowledgeAnswer,
  KnowledgeArticle,
  KnowledgeHubData,
  KnowledgePlaybook,
  KnowledgeSearchResult,
} from "@/lib/ai/knowledge/types";
import { PLAYBOOK_TITLES } from "@/lib/ai/knowledge/types";
import { InteractiveSurface, LinkOverlay, rowInteractiveClass } from "@/components/ui/interactive-surface";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type KnowledgeHubWorkspaceProps = {
  initialData: KnowledgeHubData;
  canGenerate: boolean;
  canGeneratePlaybooks: boolean;
};

type HubTab =
  | "articles"
  | "incidents"
  | "risks"
  | "reports"
  | "templates"
  | "playbooks"
  | "learnings";

const TAB_LABELS: Record<HubTab, string> = {
  articles: "Knowledge articles",
  incidents: "Resolved incidents",
  risks: "Resolved risks",
  reports: "Published reports",
  templates: "Templates",
  playbooks: "Operational playbooks",
  learnings: "Recent learnings",
};

const TAB_EMPTY: Record<
  HubTab,
  { icon: typeof BookOpen; title: string; description: string; href?: string; cta?: string }
> = {
  articles: {
    icon: BookOpen,
    title: "No knowledge articles yet",
    description:
      "Articles are generated from resolved incidents, risks, and reports. Resolve operational items or use AI generation to build organizational memory.",
  },
  incidents: {
    icon: ShieldAlert,
    title: "No resolved incidents in memory",
    description: "Close and document incidents to capture learnings for your team and future playbooks.",
    href: "/incidents",
    cta: "View incidents",
  },
  risks: {
    icon: ShieldCheck,
    title: "No resolved risks in memory",
    description: "Mitigate and close risks to enrich your knowledge base with proven remediation steps.",
    href: "/risks",
    cta: "View risks",
  },
  reports: {
    icon: FileText,
    title: "No published reports yet",
    description: "Publish client reports to preserve executive summaries and delivery history in memory.",
    href: "/reports",
    cta: "View reports",
  },
  templates: {
    icon: ScrollText,
    title: "No report templates yet",
    description: "Create templates to standardize delivery and feed consistent knowledge into your workspace.",
    href: "/reports/templates",
    cta: "Manage templates",
  },
  playbooks: {
    icon: Layers,
    title: "No operational playbooks yet",
    description: "Generate playbooks from resolved incidents or build them manually for repeatable response workflows.",
  },
  learnings: {
    icon: Lightbulb,
    title: "No recent learnings captured",
    description: "Learnings appear as your team resolves incidents, updates risks, and publishes reports.",
  },
};

export function KnowledgeHubWorkspace({
  initialData,
  canGenerate,
  canGeneratePlaybooks,
}: KnowledgeHubWorkspaceProps) {
  const [data] = useState(initialData);
  const [tab, setTab] = useState<HubTab>("articles");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [searchResult, setSearchResult] = useState<KnowledgeSearchResult | null>(null);
  const [answer, setAnswer] = useState<KnowledgeAnswer | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<KnowledgeArticle | null>(null);
  const [generatedPlaybook, setGeneratedPlaybook] = useState<KnowledgePlaybook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorRetryable, setErrorRetryable] = useState(false);
  const [lastFailedAction, setLastFailedAction] = useState<"search" | "ask" | null>(null);
  const [isPending, startTransition] = useTransition();

  const runSearch = useCallback(() => {
    if (!query.trim()) return;
    setError(null);
    setErrorRetryable(false);
    setLastFailedAction("search");
    startTransition(async () => {
      const result = await searchKnowledgeServerAction({ query: query.trim() });
      if (!result.ok) {
        setError(result.error);
        setErrorRetryable(result.retryable ?? false);
        return;
      }
      setSearchResult(result.result);
      setAnswer(null);
    });
  }, [query]);

  const askQuestion = useCallback(() => {
    if (query.trim().length < 4) {
      setError("Ask a complete question (at least 4 characters).");
      setErrorRetryable(false);
      return;
    }
    setError(null);
    setErrorRetryable(false);
    setLastFailedAction("ask");
    startTransition(async () => {
      const result = await answerKnowledgeQuestionServerAction({ question: query.trim() });
      if (!result.ok) {
        setError(result.error);
        setErrorRetryable(result.retryable ?? false);
        return;
      }
      setAnswer(result.answer);
    });
  }, [query]);

  const retryLastAction = useCallback(() => {
    if (lastFailedAction === "ask") {
      askQuestion();
      return;
    }
    runSearch();
  }, [askQuestion, lastFailedAction, runSearch]);

  const generateArticle = useCallback(
    (sourceId: string) => {
      if (!canGenerate) return;
      setError(null);
      startTransition(async () => {
        const result = await generateKnowledgeArticleServerAction({
          sourceType: "report",
          sourceId,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setGeneratedArticle(result.article);
      });
    },
    [canGenerate],
  );

  const generatePlaybook = useCallback(
    (title: string) => {
      if (!canGeneratePlaybooks) return;
      setError(null);
      startTransition(async () => {
        const result = await generatePlaybookServerAction({ title });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setGeneratedPlaybook(result.playbook);
      });
    },
    [canGeneratePlaybooks],
  );

  const filteredItems = useMemo(() => {
    const items = getTabItems(data, tab);
    if (category === "all") return items;
    return items.filter((item) => {
      if ("severity" in item && item.severity) return item.severity === category;
      if ("entityType" in item) return item.entityType === category;
      return true;
    });
  }, [category, data, tab]);

  return (
    <div className="space-y-8">
      {error ? (
        <AIErrorAlert
          message={error}
          retryable={errorRetryable}
          onRetry={retryLastAction}
          onClear={() => {
            setError(null);
            setAnswer(null);
            setSearchResult(null);
          }}
          loading={isPending}
        />
      ) : null}

      <KnowledgeHealthCard health={data.health} recommendations={data.recommendations} />

      <section aria-labelledby="knowledge-search-heading" className="rounded-2xl border border-border bg-surface/80 p-5">
        <h2 id="knowledge-search-heading" className="text-lg font-semibold text-foreground">
          Knowledge search
        </h2>
        <p className="mt-1 text-sm text-muted">
          Search clients, reports, incidents, risks, mitigations, and resolution notes.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              label="Search query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="How was this solved before?"
              className="pl-9"
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
            />
          </div>
          <Select
            label="Category filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="sm:w-44"
            options={[
              { value: "all", label: "All categories" },
              { value: "report", label: "Reports" },
              { value: "incident", label: "Incidents" },
              { value: "risk", label: "Risks" },
              { value: "critical", label: "Critical severity" },
              { value: "high", label: "High severity" },
            ]}
          />
          <Button type="button" variant="primary" onClick={runSearch} disabled={isPending}>
            Search
          </Button>
          <Button type="button" variant="outline" onClick={askQuestion} disabled={isPending}>
            Ask AI
          </Button>
        </div>

        {searchResult ? (
          <div className="mt-4 space-y-2" role="region" aria-label="Search results">
            <p className="text-sm text-muted">
              {searchResult.totalCount} verified result{searchResult.totalCount === 1 ? "" : "s"}
            </p>
            <ul className="space-y-2" role="list">
              {searchResult.snippets.map((snippet) => (
                <li key={snippet.id} className="rounded-lg border border-border px-3 py-2">
                  <Link href={snippet.href} className={cn(linkText, "text-sm font-medium")}>
                    {snippet.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">{snippet.excerpt}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {answer ? (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4" role="region" aria-label="AI answer">
            <p className="text-sm font-semibold text-foreground">
              AI answer · confidence {answer.confidence}%
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{answer.summary}</p>
            {answer.insufficientData ? (
              <p className="mt-2 text-xs text-muted">Insufficient verified data — no citations available.</p>
            ) : (
              <ul className="mt-3 space-y-1 text-xs text-muted" role="list">
                {answer.citations.map((citation) => (
                  <li key={citation.id}>
                    Source:{" "}
                    <Link href={citation.href} className={linkText}>
                      {citation.citation}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Knowledge categories">
        {(Object.keys(TAB_LABELS) as HubTab[]).map((key) => (
          <Button
            key={key}
            type="button"
            id={`knowledge-tab-${key}`}
            size="sm"
            variant={tab === key ? "primary" : "outline"}
            onClick={() => setTab(key)}
            role="tab"
            aria-selected={tab === key}
            aria-controls={`knowledge-panel-${key}`}
            tabIndex={tab === key ? 0 : -1}
          >
            {TAB_LABELS[key]}
          </Button>
        ))}
      </div>

      <div
        id={`knowledge-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`knowledge-tab-${tab}`}
      >
        <TabContent tab={tab} items={filteredItems} onGenerateArticle={canGenerate ? generateArticle : undefined} />
      </div>
      {canGeneratePlaybooks ? (
        <section aria-labelledby="playbook-generation-heading" className="rounded-2xl border border-border bg-surface/80 p-5">
          <h2 id="playbook-generation-heading" className="text-lg font-semibold text-foreground">
            Generate playbooks
          </h2>
          <p className="mt-1 text-sm text-muted">Playbooks evolve from verified organizational history.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PLAYBOOK_TITLES.map((title) => (
              <Button
                key={title}
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => generatePlaybook(title)}
              >
                {title}
              </Button>
            ))}
          </div>
          {generatedPlaybook ? (
            <div className="mt-4 rounded-lg border border-border p-4">
              <p className="font-semibold text-foreground">{generatedPlaybook.title}</p>
              <p className="mt-1 text-sm text-muted">{generatedPlaybook.summary}</p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-foreground">
                {generatedPlaybook.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      ) : null}

      {generatedArticle ? (
        <section className="rounded-2xl border border-border bg-surface/80 p-5" aria-label="Generated article">
          <p className="text-lg font-semibold text-foreground">{generatedArticle.title}</p>
          <p className="mt-2 text-sm text-muted">{generatedArticle.summary}</p>
          <p className="mt-4 text-sm text-foreground">{generatedArticle.recommendations}</p>
        </section>
      ) : null}
    </div>
  );
}

function getTabItems(data: KnowledgeHubData, tab: HubTab) {
  switch (tab) {
    case "articles":
      return data.articles;
    case "incidents":
      return data.resolvedIncidents;
    case "risks":
      return data.resolvedRisks;
    case "reports":
      return data.publishedReports;
    case "templates":
      return data.templates;
    case "playbooks":
      return data.playbooks;
    case "learnings":
      return data.recentLearnings;
    default:
      return [];
  }
}

function TabContent({
  tab,
  items,
  onGenerateArticle,
}: {
  tab: HubTab;
  items: Array<
    | KnowledgeHubData["articles"][number]
    | KnowledgeHubData["resolvedIncidents"][number]
    | KnowledgeHubData["playbooks"][number]
  >;
  onGenerateArticle?: (sourceId: string) => void;
}) {
  if (items.length === 0) {
    const empty = TAB_EMPTY[tab];
    return (
      <EmptyState
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
        action={
          empty.href && empty.cta ? (
            <LinkButton href={empty.href} size="sm">
              {empty.cta}
            </LinkButton>
          ) : undefined
        }
      />
    );
  }

  if (tab === "articles") {
    return (
      <ul className="space-y-3" role="list">
        {(items as KnowledgeHubData["articles"]).map((article) => (
          <li key={article.id} className="rounded-xl border border-border bg-surface/80 p-4">
            <p className="font-semibold text-foreground">{article.title}</p>
            <p className="mt-1 text-sm text-muted">{article.summary}</p>
            <p className="mt-2 text-xs text-muted">Confidence: {article.confidence}%</p>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "playbooks") {
    return (
      <ul className="space-y-3" role="list">
        {(items as KnowledgeHubData["playbooks"]).map((playbook) => (
          <li key={playbook.id} className="rounded-xl border border-border bg-surface/80 p-4">
            <p className="font-semibold text-foreground">{playbook.title}</p>
            <p className="mt-1 text-sm text-muted">{playbook.summary}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-foreground">
              {playbook.steps.slice(0, 4).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-3" role="list">
      {(items as KnowledgeHubData["resolvedIncidents"]).map((item) => (
        <li key={`${item.entityType}-${item.entityId}`}>
          <InteractiveSurface className="rounded-xl border border-border bg-surface/80 p-4">
            <LinkOverlay href={item.href} ariaLabel={`Open ${item.title}`} />
            <div className="relative z-10">
              <span className="font-semibold text-foreground">{item.title}</span>
              <p className="mt-1 text-sm text-muted">{item.excerpt}</p>
              {onGenerateArticle && item.entityType !== "template" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn(rowInteractiveClass, "mt-3")}
                  data-row-interactive
                  onClick={(event) => {
                    event.stopPropagation();
                    onGenerateArticle(item.entityId);
                  }}
                >
                  Generate article
                </Button>
              ) : null}
            </div>
          </InteractiveSurface>
        </li>
      ))}
    </ul>
  );
}
