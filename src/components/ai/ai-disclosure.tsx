import { cn } from "@/lib/utils/cn";

export type AiDisclosureVariant = "assisted" | "generated";

const DISCLOSURE_COPY: Record<AiDisclosureVariant, string> = {
  assisted: "AI-assisted",
  generated: "AI-generated · Verify before use",
};

type AiDisclosureProps = {
  /** `generated` for model outputs; `assisted` for interactive drafting surfaces. */
  variant?: AiDisclosureVariant;
  className?: string;
  /** Optional extra context (e.g. human review expectation). */
  hint?: string;
};

/**
 * Proportionate EU AI Act Art. 50-style disclosure for generative AI surfaces.
 * Presentational only — does not claim legal compliance.
 */
export function AiDisclosure({
  variant = "generated",
  className,
  hint,
}: AiDisclosureProps) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
        className,
      )}
      data-ai-disclosure={variant}
    >
      {DISCLOSURE_COPY[variant]}
      {hint ? <span className="ml-1 font-normal normal-case tracking-normal">· {hint}</span> : null}
    </p>
  );
}

export { DISCLOSURE_COPY };
