import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { metricLabel } from "@/lib/ui/tokens";

export type MetricCardItem = {
  label: string;
  value: string;
  href?: string;
};

type MetricCardGridProps = {
  cards: MetricCardItem[];
  columns?: "3" | "4";
  className?: string;
};

/** Shared sales/dashboard metric tile grid — Card chrome, consistent label/value. */
export function MetricCardGrid({ cards, columns = "4", className }: MetricCardGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        columns === "3" ? "xl:grid-cols-3" : "xl:grid-cols-4",
        className,
      )}
    >
      {cards.map((card) => {
        const content = (
          <>
            <p className={metricLabel}>{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{card.value}</p>
          </>
        );

        if (card.href) {
          return (
            <Link key={card.label} href={card.href} className="block">
              <Card
                variant="interactive"
                padding="sm"
                className="h-full hover:border-primary/20"
              >
                {content}
              </Card>
            </Link>
          );
        }

        return (
          <Card key={card.label} padding="sm">
            {content}
          </Card>
        );
      })}
    </div>
  );
}

export function MetricCardContent({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
