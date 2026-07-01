import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Code2,
  CreditCard,
  Database,
  MessageSquare,
  Sparkles,
  Users,
  Webhook,
  Zap,
} from "lucide-react";
import {
  getIntegrationsBySection,
  INTEGRATION_SECTION_LABELS,
  INTEGRATION_SECTION_ORDER,
  INTEGRATION_STATUS_LABELS,
  type IntegrationCatalogItem,
  type IntegrationSectionKey,
  type IntegrationStatus,
} from "@/lib/marketing/integrations-catalog";
import { cn } from "@/lib/utils/cn";

const INTEGRATION_ICONS: Record<string, LucideIcon> = {
  stripe: CreditCard,
  supabase: Database,
  openai: Sparkles,
  anthropic: Bot,
  slack: MessageSquare,
  teams: Users,
  zapier: Zap,
  webhooks: Webhook,
  "api-access": Code2,
};

const STATUS_BADGE_STYLES: Record<IntegrationStatus, string> = {
  connected: "border-success/30 bg-success/10 text-success",
  available: "border-primary/30 bg-primary/10 text-primary-foreground",
  optional: "border-warning/30 bg-warning/10 text-warning",
  planned: "border-white/15 bg-white/5 text-primary-foreground/70",
  enterprise: "border-accent-blue/30 bg-accent-blue/10 text-accent-blue",
};

function IntegrationCard({ item }: { item: IntegrationCatalogItem }) {
  const Icon = INTEGRATION_ICONS[item.id] ?? Code2;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm transition-colors hover:border-white/20 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
          <Icon className="h-5 w-5 text-primary-foreground/90" aria-hidden />
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            STATUS_BADGE_STYLES[item.status],
          )}
        >
          {INTEGRATION_STATUS_LABELS[item.status]}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-primary-foreground/75">{item.description}</p>
    </article>
  );
}

function IntegrationSection({ sectionKey }: { sectionKey: IntegrationSectionKey }) {
  const items = getIntegrationsBySection(sectionKey);

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-white">
        {INTEGRATION_SECTION_LABELS[sectionKey]}
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <IntegrationCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function IntegrationCatalogGrid() {
  return (
    <div className="space-y-14">
      {INTEGRATION_SECTION_ORDER.map((sectionKey) => (
        <IntegrationSection key={sectionKey} sectionKey={sectionKey} />
      ))}
    </div>
  );
}
