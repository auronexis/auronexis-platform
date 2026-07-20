import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type ExecutiveBriefAiLinkProps = {
  enabled: boolean;
};

export function ExecutiveBriefAiLink({ enabled }: ExecutiveBriefAiLinkProps) {
  if (!enabled) return null;

  return (
    <Link
      href="/copilot?task=executive_brief&prompt=Create%20an%20executive%20brief."
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground",
        transitionInteractive,
        focusRing,
        "hover:border-primary/40 hover:text-primary",
      )}
      aria-label="Generate AI executive brief"
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden />
      Generate AI brief
    </Link>
  );
}
