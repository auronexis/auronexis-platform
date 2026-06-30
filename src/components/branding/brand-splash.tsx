import { cn } from "@/lib/utils/cn";

type BrandSplashProps = {
  fullScreen?: boolean;
  className?: string;
  variant?: "light" | "dark";
  message?: string;
};

/** In-app loading state — text wordmark only (no logo PNG). */
export function BrandSplash({
  fullScreen = false,
  className,
  variant = "dark",
  message = "Loading workspace...",
}: BrandSplashProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "flex items-center justify-center px-4",
        isDark ? "bg-slate-950" : "bg-slate-100",
        fullScreen && "min-h-screen",
        !fullScreen && "min-h-[50vh] py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      {isDark ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-10 py-8 text-center shadow-2xl backdrop-blur">
          <div className="text-3xl font-bold tracking-tight text-white">Auroranexis</div>
          <p className="mt-3 text-sm text-slate-300">{message}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-10 py-8 text-center shadow-2xl">
          <div className="text-3xl font-bold tracking-tight text-slate-950">Auroranexis</div>
          <p className="mt-3 text-sm text-slate-600">{message}</p>
        </div>
      )}
    </div>
  );
}
