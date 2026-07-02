import { recordActivityEvent } from "@/lib/activity/record";
import { calculateHealth } from "@/lib/health/engine";
import {
  gatherClientHealthMetrics,
  getLatestHealthSnapshot,
  listHealthSnapshots,
} from "@/lib/health/queries";
import type { HealthSnapshot } from "@/lib/health/types";
import { parseHealthBreakdown } from "@/lib/health/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientView } from "@/lib/clients/types";

type RecordHealthSnapshotInput = {
  organizationId: string;
  clientId: string;
  score: number;
  status: HealthSnapshot["status"];
  delta: number;
  reason: string | null;
  breakdown: HealthSnapshot["breakdown"];
  calculatedAt?: string;
};

/** Persist a health snapshot — never throws. */
export async function recordHealthSnapshot(input: RecordHealthSnapshotInput): Promise<HealthSnapshot | null> {
  try {
    const admin = createAdminClient();
    const payload = {
      organization_id: input.organizationId,
      client_id: input.clientId,
      score: input.score,
      status: input.status,
      delta: input.delta,
      reason: input.reason,
      breakdown: input.breakdown,
      calculated_at: input.calculatedAt ?? new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("health_snapshots")
      .insert(payload as never)
      .select(
        "id, organization_id, client_id, score, status, delta, reason, breakdown, calculated_at",
      )
      .single();

    if (error) {
      console.warn("[health] failed to record snapshot:", error.message);
      return null;
    }

    const row = data as Record<string, unknown>;
    const snapshot: HealthSnapshot = {
      id: String(row.id),
      organization_id: String(row.organization_id),
      client_id: String(row.client_id),
      score: Number(row.score),
      status: row.status as HealthSnapshot["status"],
      delta: Number(row.delta ?? 0),
      reason: (row.reason as string | null) ?? null,
      breakdown: parseHealthBreakdown(row.breakdown as never),
      calculated_at: String(row.calculated_at),
    };

    const supabase = await createClient();
    await supabase
      .from("clients")
      .update({ health_score: input.score } as never)
      .eq("id", input.clientId)
      .eq("organization_id", input.organizationId);

    return snapshot;
  } catch (error) {
    console.warn("[health] failed to record snapshot:", error);
    return null;
  }
}

type ComputeHealthOptions = {
  actorUserId?: string | null;
  emitActivity?: boolean;
};

/** Calculate, persist, and optionally emit health.changed activity. */
export async function computeAndRecordClientHealth(
  session: SessionContext,
  client: Pick<ClientView, "id" | "name" | "status" | "updated_at">,
  options: ComputeHealthOptions = {},
): Promise<HealthSnapshot | null> {
  try {
    const previous = await getLatestHealthSnapshot(session, client.id);
    const metrics = await gatherClientHealthMetrics(session, client.id, client.status);
    const result = calculateHealth({
      client,
      metrics,
      previousScore: previous?.score ?? null,
    });

    const scoreChanged = previous != null && previous.score !== result.score;
    const isFirstSnapshot = previous == null;
    let snapshot: HealthSnapshot | null = previous;

    if (isFirstSnapshot || scoreChanged) {
      snapshot = await recordHealthSnapshot({
        organizationId: session.organization.id,
        clientId: client.id,
        score: result.score,
        status: result.status,
        delta: result.delta,
        reason: result.reason,
        breakdown: result.breakdown,
      });

      if (
        scoreChanged &&
        snapshot &&
        options.emitActivity !== false
      ) {
        await recordActivityEvent({
          organizationId: session.organization.id,
          actorUserId: options.actorUserId ?? session.user.id,
          entityType: "client",
          entityId: client.id,
          eventType: "health.changed",
          action: "health_changed",
          title: `Health score changed: ${previous.score} → ${result.score}`,
          description: result.reason,
          metadata: {
            old_score: previous.score,
            new_score: result.score,
            delta: result.delta,
            status: result.status,
            reason: result.reason,
          },
        });

        void import("@/lib/webhooks/events")
          .then(({ dispatchWebhookEvent }) =>
            dispatchWebhookEvent({
              organizationId: session.organization.id,
              eventType: "health.changed",
              payload: {
                clientId: client.id,
                clientName: client.name,
                previousScore: previous.score,
                score: result.score,
                delta: result.delta,
                status: result.status,
              },
            }),
          )
          .catch(() => undefined);
      }
    } else if (previous) {
      snapshot = {
        ...previous,
        breakdown: result.breakdown,
        reason: result.reason,
        delta: 0,
      };
    }

    void import("@/lib/risks/detector")
      .then(({ detectClientRisks, resolveHealthEngineRisks }) => {
        if (result.status === "healthy" || result.status === "excellent") {
          void resolveHealthEngineRisks(session, client.id);
        } else {
          void detectClientRisks(session, client.id);
        }
      })
      .catch(() => undefined);

    return snapshot;
  } catch (error) {
    console.warn("[health] failed to compute client health:", error);
    return null;
  }
}

export async function getClientHealthDetail(
  session: SessionContext,
  client: Pick<ClientView, "id" | "name" | "status" | "updated_at">,
) {
  const latest = await computeAndRecordClientHealth(session, client);
  const history = await listHealthSnapshots(session, client.id, 10);

  return {
    latest: latest ?? (await getLatestHealthSnapshot(session, client.id)),
    history,
  };
}
