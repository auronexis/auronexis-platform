import Link from "next/link";
import {
  EINVOICE_VIEWER_DEMO_META,
  type EInvoiceViewerDemoId,
} from "@/lib/einvoice-viewer/demo-catalog";
import { focusRing } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type DemoSwitcherProps = {
  active: EInvoiceViewerDemoId;
};

export function DemoSwitcher({ active }: DemoSwitcherProps) {
  const demos = (Object.keys(EINVOICE_VIEWER_DEMO_META) as EInvoiceViewerDemoId[]).map(
    (id) => ({
      id,
      label: EINVOICE_VIEWER_DEMO_META[id].label,
    }),
  );

  return (
    <nav aria-label="Demo-Auswahl" className="flex flex-wrap gap-2 print:hidden">
      {demos.map((demo) => {
        const selected = demo.id === active;
        return (
          <Link
            key={demo.id}
            href={`/internal/einvoice-preview?demo=${demo.id}`}
            className={cn(
              "inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-surface text-muted hover:text-foreground",
              focusRing,
            )}
            aria-current={selected ? "page" : undefined}
          >
            {demo.label}
          </Link>
        );
      })}
    </nav>
  );
}
