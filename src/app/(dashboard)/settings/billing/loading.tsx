import { LoadingCard } from "@/components/ui/loading-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <LoadingCard lines={4} />
      <LoadingCard lines={3} />
    </div>
  );
}
