import { LoadingCard } from "@/components/ui/loading-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <LoadingCard lines={6} />
    </div>
  );
}
