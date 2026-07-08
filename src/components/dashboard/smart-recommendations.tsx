import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { Icon } from "@/components/ui/icon";
import type { SmartRecommendation } from "@/lib/dashboard/workspace-guidance";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type SmartRecommendationsProps = {
  recommendations: SmartRecommendation[];
};

export function SmartRecommendations({ recommendations }: SmartRecommendationsProps) {
  return (
    <DashboardPanel
      title="Recommended next steps"
      description="Personalized guidance based on your workspace."
    >
      {recommendations.length === 0 ? (
        <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-muted/5 px-6 py-8 text-center">
          <Icon icon={Sparkles} size="lg" className="mb-3 text-primary" />
          <p className="text-sm font-semibold text-foreground">You&apos;re on track</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Your workspace looks healthy. Explore quick actions below or open a client to continue.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "block rounded-xl border border-border bg-gradient-to-br from-surface to-surface-2 px-4 py-4",
                  transitionInteractive,
                  "hover:-translate-y-px hover:border-primary/25 hover:shadow-sm",
                  focusRing,
                )}
              >
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
                <span className="mt-3 inline-flex text-xs font-semibold text-primary">{item.cta} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
