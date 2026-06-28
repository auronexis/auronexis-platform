import { LoadingCard } from "@/components/ui/loading-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AutomationLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <LoadingCard key={index} lines={3} />
        ))}
      </div>
      <LoadingCard lines={5} />
    </div>
  );
}
