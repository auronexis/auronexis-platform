"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/sales", label: "Pipeline", match: (path: string) => path === "/sales" },
  { href: "/sales/launch", label: "Launch", match: (path: string) => path.startsWith("/sales/launch") },
  { href: "/sales/execution", label: "Execution", match: (path: string) => path.startsWith("/sales/execution") },
  { href: "/sales/sourcing", label: "Sourcing", match: (path: string) => path.startsWith("/sales/sourcing") },
  { href: "/sales/acquisition", label: "Acquisition", match: (path: string) => path.startsWith("/sales/acquisition") },
  { href: "/sales/outbound", label: "Outbound", match: (path: string) => path.startsWith("/sales/outbound") },
  { href: "/sales/proposals", label: "Proposals", match: (path: string) => path.startsWith("/sales/proposals") },
  { href: "/sales/onboarding", label: "Onboarding", match: (path: string) => path.startsWith("/sales/onboarding") },
  { href: "/sales/templates", label: "Templates", match: (path: string) => path.startsWith("/sales/templates") },
  { href: "/sales/success", label: "Success", match: (path: string) => path.startsWith("/sales/success") },
  { href: "/sales/leads", label: "Leads", match: (path: string) => path.startsWith("/sales/leads") },
  { href: "/sales/inbox", label: "Inbox", match: (path: string) => path.startsWith("/sales/inbox") },
];

export function SalesSubnav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-border-subtle pb-4">
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border-subtle text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
