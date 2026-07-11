import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type MarketingPlanCtaProps = {
  planName: string;
  className?: string;
};

export function MarketingPlanCta({ planName, className }: MarketingPlanCtaProps) {
  const isEnterprise = planName === "Enterprise";

  return (
    <Link
      href={isEnterprise ? "/contact" : "/signup"}
      className={cn(
        "mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground",
        focusRing,
        className,
      )}
    >
      {isEnterprise ? "Contact sales" : "Create workspace"}
    </Link>
  );
}
