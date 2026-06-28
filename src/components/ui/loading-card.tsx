import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type LoadingCardProps = {
  lines?: number;
  showHeader?: boolean;
  className?: string;
};

/** Placeholder card while content loads — foundation primitive only. */
export function LoadingCard({ lines = 3, showHeader = true, className }: LoadingCardProps) {
  return (
    <Card className={cn("space-y-4", className)}>
      {showHeader ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : null}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className={cn("h-3", index === lines - 1 ? "w-4/5" : "w-full")} />
        ))}
      </div>
    </Card>
  );
}
