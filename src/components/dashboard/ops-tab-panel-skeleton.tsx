import { LoadingCard } from "@/components/ui/loading-card";

/** Placeholder while an Ops tab loads. Safe to use from server and client components. */
export function OpsTabPanelSkeleton() {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-12" aria-busy="true">
      <div className="lg:col-span-8">
        <LoadingCard lines={4} />
      </div>
      <div className="lg:col-span-4">
        <LoadingCard lines={3} />
      </div>
      <div className="lg:col-span-4">
        <LoadingCard lines={3} />
      </div>
      <div className="lg:col-span-4">
        <LoadingCard lines={3} />
      </div>
    </div>
  );
}
