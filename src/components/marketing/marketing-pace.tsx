import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { marketingSectionFade } from "@/lib/ui/marketing-motion";

export type MarketingPaceTone = "default" | "muted" | "emphasis";

type MarketingPaceProps = {
  children: ReactNode;
  tone?: MarketingPaceTone;
  bordered?: boolean;
  className?: string;
  id?: string;
};

const TONE_STYLES: Record<MarketingPaceTone, string> = {
  default: "",
  muted: "bg-white/[0.02]",
  emphasis: "bg-gradient-to-b from-white/[0.04] to-transparent",
};

/**
 * Content pacing wrapper — alternates visual rhythm with white space.
 * Use between hero → features → proof → CTA sections.
 */
export function MarketingPace({
  children,
  tone = "default",
  bordered = false,
  className,
  id,
}: MarketingPaceProps) {
  return (
    <div
      id={id}
      className={cn(
        marketingSectionFade,
        bordered && "border-t border-white/10",
        TONE_STYLES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
