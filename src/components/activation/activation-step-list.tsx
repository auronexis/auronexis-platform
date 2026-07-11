import Link from "next/link";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import type { ActivationStepStatus } from "@/lib/activation/types";
import { getActivationCategoryLabel } from "@/lib/activation/steps";
import { cn } from "@/lib/utils/cn";
import { focusRing, linkText, transitionInteractive } from "@/lib/ui/tokens";

type ActivationStepListProps = {
  steps: ActivationStepStatus[];
  showCategories?: boolean;
  compact?: boolean;
};

export function ActivationStepList({
  steps,
  showCategories = false,
  compact = false,
}: ActivationStepListProps) {
  const applicableSteps = steps.filter((step) => !step.locked || step.complete);

  if (showCategories) {
    const categories = [...new Set(applicableSteps.map((step) => step.category))];
    return (
      <div className="space-y-6">
        {categories.map((category) => {
          const categorySteps = applicableSteps.filter((step) => step.category === category);
          return (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {getActivationCategoryLabel(category)}
              </h3>
              <ul className={cn("space-y-2", compact && "space-y-1.5")}>
                {categorySteps.map((step) => (
                  <ActivationStepRow key={step.id} step={step} compact={compact} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ul className={cn("space-y-2", compact && "space-y-1.5")}>
      {applicableSteps.map((step) => (
        <ActivationStepRow key={step.id} step={step} compact={compact} />
      ))}
    </ul>
  );
}

function ActivationStepRow({
  step,
  compact,
}: {
  step: ActivationStepStatus;
  compact?: boolean;
}) {
  const content = (
    <>
      {step.complete ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
      ) : step.locked ? (
        <Lock className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium text-foreground", step.complete && "text-muted", compact && "text-sm")}>
          {step.label}
          {step.required ? (
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Required
            </span>
          ) : step.optional ? (
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Optional
            </span>
          ) : null}
        </p>
        {!compact ? (
          <p className="mt-0.5 text-sm text-muted">{step.locked ? step.lockedReason : step.description}</p>
        ) : null}
      </div>
      {!step.complete && !step.locked && step.canAct ? (
        <span className={cn(linkText, "shrink-0 text-xs no-underline")}>Open</span>
      ) : null}
    </>
  );

  if (step.locked || step.complete || !step.canAct) {
    return (
      <li
        className={cn(
          "flex items-start gap-3 rounded-xl border px-3.5 py-3",
          step.complete
            ? "border-success/20 bg-success/5"
            : "border-border bg-muted/5",
          compact && "px-3 py-2.5",
        )}
        aria-current={step.complete ? undefined : "step"}
      >
        {content}
      </li>
    );
  }

  return (
    <li key={step.id}>
      <Link
        href={step.href}
        className={cn(
          "flex items-start gap-3 rounded-xl border border-border bg-muted/5 px-3.5 py-3 text-sm hover:border-primary/20 hover:bg-primary/5",
          transitionInteractive,
          focusRing,
          compact && "px-3 py-2.5",
        )}
        aria-current="step"
      >
        {content}
      </Link>
    </li>
  );
}
