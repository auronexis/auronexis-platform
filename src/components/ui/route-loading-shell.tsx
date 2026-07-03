import { LoadingCard } from "@/components/ui/loading-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type RouteLoadingShellProps = {
  variant?: "page" | "table" | "cards" | "settings";
  className?: string;
};

export function RouteLoadingShell({ variant = "page", className }: RouteLoadingShellProps) {
  if (variant === "table") {
    return (
      <div className={cn("space-y-4", className)} aria-busy="true" aria-label="Loading content">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="overflow-hidden rounded-xl border border-border/70">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex gap-4 border-b border-border/60 px-4 py-3 last:border-b-0">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div
        className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}
        aria-busy="true"
        aria-label="Loading content"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingCard key={index} lines={3} />
        ))}
      </div>
    );
  }

  if (variant === "settings") {
    return (
      <div className={cn("space-y-6", className)} aria-busy="true" aria-label="Loading content">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <LoadingCard lines={4} />
        <LoadingCard lines={3} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)} aria-busy="true" aria-label="Loading content">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingCard key={index} lines={2} showHeader={false} />
        ))}
      </div>
      <LoadingCard lines={5} />
    </div>
  );
}
