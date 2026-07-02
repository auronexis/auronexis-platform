import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PredictiveSnapshotRecord } from "@/lib/predictive/types";
import type { Json } from "@/types/database";

type PersistPredictiveSnapshotInput = {
  organizationId: string;
  clientId?: string | null;
  snapshotDate?: string;
  healthScore?: number | null;
  riskScore?: number | null;
  incidentCount?: number | null;
  breachCount?: number | null;
  monitoringFailures?: number | null;
  engagementScore?: number | null;
  predictedHealth?: number | null;
  predictedRisk?: number | null;
  predictedIncidents?: number | null;
  confidence?: number | null;
  metadata?: Record<string, unknown>;
};

function mapSnapshotRow(row: Record<string, unknown>): PredictiveSnapshotRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    clientId: row.client_id == null ? null : String(row.client_id),
    snapshotDate: String(row.snapshot_date),
    healthScore: row.health_score == null ? null : Number(row.health_score),
    riskScore: row.risk_score == null ? null : Number(row.risk_score),
    incidentCount: row.incident_count == null ? null : Number(row.incident_count),
    breachCount: row.breach_count == null ? null : Number(row.breach_count),
    monitoringFailures:
      row.monitoring_failures == null ? null : Number(row.monitoring_failures),
    engagementScore: row.engagement_score == null ? null : Number(row.engagement_score),
    predictedHealth: row.predicted_health == null ? null : Number(row.predicted_health),
    predictedRisk: row.predicted_risk == null ? null : Number(row.predicted_risk),
    predictedIncidents:
      row.predicted_incidents == null ? null : Number(row.predicted_incidents),
    confidence: row.confidence == null ? null : Number(row.confidence),
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: String(row.created_at),
  };
}

/** Persist predictive snapshot — never throws. */
export async function persistPredictiveSnapshot(
  input: PersistPredictiveSnapshotInput,
): Promise<PredictiveSnapshotRecord | null> {
  try {
    const admin = createAdminClient();
    const snapshotDate =
      input.snapshotDate ?? new Date().toISOString().slice(0, 10);

    const payload = {
      organization_id: input.organizationId,
      client_id: input.clientId ?? null,
      snapshot_date: snapshotDate,
      health_score: input.healthScore ?? null,
      risk_score: input.riskScore ?? null,
      incident_count: input.incidentCount ?? null,
      breach_count: input.breachCount ?? null,
      monitoring_failures: input.monitoringFailures ?? null,
      engagement_score: input.engagementScore ?? null,
      predicted_health: input.predictedHealth ?? null,
      predicted_risk: input.predictedRisk ?? null,
      predicted_incidents: input.predictedIncidents ?? null,
      confidence: input.confidence ?? null,
      metadata: (input.metadata ?? {}) as Json,
    };

    const { data, error } = await admin
      .from("predictive_snapshots")
      .insert(payload as never)
      .select("*")
      .single();

    if (error || !data) {
      console.warn("[predictive] failed to persist snapshot:", error?.message);
      return null;
    }

    return mapSnapshotRow(data as Record<string, unknown>);
  } catch (error) {
    console.warn("[predictive] failed to persist snapshot:", error);
    return null;
  }
}

export async function listRecentPredictiveSnapshots(
  organizationId: string,
  limit = 30,
): Promise<PredictiveSnapshotRecord[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("predictive_snapshots")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapSnapshotRow);
  } catch {
    return [];
  }
}
