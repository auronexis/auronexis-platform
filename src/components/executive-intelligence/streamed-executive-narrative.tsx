import { cache } from "react";
import { requireSession } from "@/lib/auth/session";
import { checkPlanFeatureForSession } from "@/lib/plans";
import { canGenerateExecutiveIntelligence } from "@/lib/executive-intelligence/guards";
import { generateGroundedExecutiveNarrative } from "@/lib/executive-intelligence/provider";
import type {
  ExecutiveBriefing,
  ExecutiveIntelligenceSnapshot,
} from "@/lib/executive-intelligence/types";
import type { PlanKey } from "@/lib/billing/plans";
import { AiDisclosure } from "@/components/ai/ai-disclosure";
import { SkeletonText } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const NARRATIVE_TIMEOUT_MS = 8_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("narrative_timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type NarrativeInput = {
  snapshot: ExecutiveIntelligenceSnapshot;
  briefing: ExecutiveBriefing;
  planKey: PlanKey;
};

/**
 * Request-memoized AI narrative. Errors/timeouts fall back to the deterministic briefing.
 * Call once per request and pass the returned Promise into status/body slots.
 */
export const resolveStreamedExecutiveNarrative = cache(
  async function resolveStreamedExecutiveNarrative(
    input: NarrativeInput,
  ): Promise<ExecutiveBriefing> {
    try {
      const session = await requireSession();
      if (!canGenerateExecutiveIntelligence(session)) {
        return input.briefing;
      }

      const aiAccess = await checkPlanFeatureForSession(session, "ai_report_assistant");
      if (!aiAccess.allowed) {
        return input.briefing;
      }

      const narrative = await withTimeout(
        generateGroundedExecutiveNarrative({
          session,
          snapshot: input.snapshot,
          briefing: input.briefing,
          planKey: input.planKey,
          aiAllowed: true,
        }),
        NARRATIVE_TIMEOUT_MS,
      );

      if (narrative.generatedBy === "ai_assisted") {
        return {
          ...input.briefing,
          narrative: narrative.narrative,
          generatedBy: "ai_assisted",
        };
      }
      return input.briefing;
    } catch {
      return input.briefing;
    }
  },
);

export function ExecutiveNarrativeSkeleton() {
  return (
    <Card padding="lg" className="space-y-3" aria-busy="true" aria-live="polite">
      <h2 className="text-sm font-semibold text-foreground">Narrative</h2>
      <span className="sr-only">Generating AI narrative</span>
      <SkeletonText lines={6} className="rounded-lg bg-muted/30 p-4" />
    </Card>
  );
}

export async function StreamedExecutiveNarrativeStatus({
  narrativePromise,
  aiEnabled,
}: {
  narrativePromise: Promise<ExecutiveBriefing>;
  aiEnabled: boolean;
}) {
  const resolved = await narrativePromise;
  return (
    <>
      <span className="mt-2 inline-flex rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted">
        {resolved.generatedBy === "ai_assisted" ? "AI-assisted briefing" : "Deterministic briefing"}
        {!aiEnabled ? " · AI narrative locked on plan" : ""}
      </span>
      {resolved.generatedBy === "ai_assisted" ? (
        <AiDisclosure variant="assisted" className="mt-2" hint="Verify before use" />
      ) : null}
    </>
  );
}

export async function StreamedExecutiveNarrativeBody({
  narrativePromise,
}: {
  narrativePromise: Promise<ExecutiveBriefing>;
}) {
  const resolved = await narrativePromise;
  return (
    <Card padding="lg" className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Narrative</h2>
      <pre className="whitespace-pre-wrap rounded-lg bg-muted/30 p-4 text-sm text-foreground">
        {resolved.narrative}
      </pre>
    </Card>
  );
}
