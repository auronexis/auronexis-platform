import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">404</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="text-sm text-muted">
          This workspace page does not exist or you may not have access to it.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Return to dashboard
        </Link>
        <Link
          href="/settings"
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
