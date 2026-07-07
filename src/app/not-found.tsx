import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/company/contact";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">404</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="text-sm text-muted">
          The page you requested does not exist, may have moved, or requires a signed-in workspace.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Back home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Go to dashboard
        </Link>
        <Link
          href="/support"
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Get support
        </Link>
      </div>
      <p className="text-sm text-muted">
        Need help?{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">
          Contact support
        </a>
      </p>
    </div>
  );
}
