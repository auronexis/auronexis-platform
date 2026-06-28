import { cn } from "@/lib/utils/cn";
import { PLATFORM_NAME } from "@/lib/branding/defaults";

type BrandSplashProps = {
  fullScreen?: boolean;
  className?: string;
};

function LoadingIndicator() {
  const dots = [
    { className: "bg-primary", delay: "0ms" },
    { className: "bg-info", delay: "150ms" },
    { className: "bg-secondary", delay: "300ms" },
  ] as const;

  return (
    <div className="mt-8 flex w-full flex-col items-center gap-4" aria-hidden>
      <div className="flex items-center justify-center gap-1.5">
        {dots.map((dot) => (
          <span
            key={dot.delay}
            className={cn(
              "h-1.5 w-1.5 rounded-full motion-safe:animate-pulse motion-reduce:animate-none",
              dot.className,
            )}
            style={{ animationDelay: dot.delay }}
          />
        ))}
      </div>
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-border-subtle">
        <div className="skeleton-shimmer h-full w-2/5 rounded-full bg-gradient-to-r from-primary/40 via-info/50 to-secondary/40" />
      </div>
    </div>
  );
}

/** In-app loading state — text-only brand on light card (no black-tile icon). */
export function BrandSplash({ fullScreen = false, className }: BrandSplashProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background px-4",
        fullScreen && "min-h-screen",
        !fullScreen && "min-h-[50vh] py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div
        className={cn(
          "flex w-full max-w-[480px] flex-col items-center rounded-2xl border border-border-subtle bg-surface-2/60 px-8 py-10 text-center shadow-sm sm:px-12 sm:py-12",
        )}
      >
        <p className="text-xl font-semibold tracking-tight text-foreground">{PLATFORM_NAME}</p>
        <p className="mt-2 text-sm text-muted">Loading workspace…</p>
        <LoadingIndicator />
      </div>
    </div>
  );
}
