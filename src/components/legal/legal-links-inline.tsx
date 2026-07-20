import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/company/contact";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type LegalLinksInlineProps = {
  className?: string;
};

export function LegalLinksInline({ className }: LegalLinksInlineProps) {
  return (
    <nav
      aria-label="Legal and support"
      className={cn("flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted", className)}
    >
      {FOOTER_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn("rounded hover:text-foreground hover:underline", focusRing)}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
