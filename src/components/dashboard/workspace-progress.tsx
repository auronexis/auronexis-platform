import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import {
  getWorkspaceProgressPercent,
  type WorkspaceProgressItem,
} from "@/lib/dashboard/workspace-guidance";
import { cn } from "@/lib/utils/cn";
import { focusRing, linkText, transitionInteractive } from "@/lib/ui/tokens";

type WorkspaceProgressProps = {
  items: WorkspaceProgressItem[];
};

export function WorkspaceProgress({ items }: WorkspaceProgressProps) {
  const percent = getWorkspaceProgressPercent(items);

  return (
    <DashboardPanel
      title="Workspace progress"
      description="Complete these steps to get the most from Auroranexis."
    >
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{percent}% complete</span>
            <span className="text-muted">
              {items.filter((item) => item.complete).length} of {items.length}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted/15"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Workspace setup progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm",
                  item.complete
                    ? "border-success/20 bg-success/5 text-foreground"
                    : "border-border bg-muted/5 text-foreground hover:border-primary/20 hover:bg-primary/5",
                  transitionInteractive,
                  focusRing,
                )}
              >
                {item.complete ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                )}
                <span className={cn("flex-1 font-medium", item.complete && "text-muted")}>
                  {item.label}
                </span>
                {!item.complete ? (
                  <span className={cn(linkText, "text-xs no-underline")}>Start</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </DashboardPanel>
  );
}
