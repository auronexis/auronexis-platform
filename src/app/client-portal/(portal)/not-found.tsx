import Link from "next/link";

export default function PortalNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">404</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="text-sm text-muted">
          This portal page does not exist or is no longer available.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/client-portal/overview"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Portal overview
        </Link>
        <Link
          href="/client-portal/login"
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
