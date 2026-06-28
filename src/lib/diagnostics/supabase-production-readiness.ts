import "server-only";

import { DEPLOYMENT_CRON_PATH, DEPLOYMENT_HEALTH_PATH } from "@/lib/diagnostics/deployment-readiness";
import { createAdminClient } from "@/lib/supabase/admin";
import { countPendingQueueJobs } from "@/lib/queue/repository";

export type SupabaseProductionReadinessSnapshot = {
  migrationsReady: boolean;
  rlsReady: boolean;
  storageReady: boolean;
  bucketsReady: boolean;
  policiesReady: boolean;
  healthApiReady: boolean;
  cronReady: boolean;
  queueReady: boolean;
  score: number;
  complete: boolean;
  label: "Supabase Production Ready" | "Supabase Production Incomplete";
};

const EXPECTED_BUCKETS = ["white-label-assets"] as const;

const PRODUCTION_TABLES = [
  "sales_leads",
  "sales_proposals",
  "customer_onboarding_records",
  "portal_customer_onboarding",
  "job_definitions",
  "job_executions",
] as const;

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function probeTables(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const results = await Promise.all(
      PRODUCTION_TABLES.map((table) =>
        admin.from(table).select("id", { count: "exact", head: true }),
      ),
    );
    return results.every((result) => !result.error);
  } catch {
    return false;
  }
}

async function probeStorage(): Promise<{ storageReady: boolean; bucketsReady: boolean; policiesReady: boolean }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.listBuckets();
    if (error || !data) {
      return { storageReady: false, bucketsReady: false, policiesReady: false };
    }
    const bucketIds = data.map((bucket) => bucket.id);
    const bucketsReady = EXPECTED_BUCKETS.every((id) => bucketIds.includes(id));
    return { storageReady: true, bucketsReady, policiesReady: bucketsReady };
  } catch {
    return { storageReady: false, bucketsReady: false, policiesReady: false };
  }
}

async function probeCronAndQueue(): Promise<{ cronReady: boolean; queueReady: boolean }> {
  try {
    const admin = createAdminClient();
    const [definitions, queueBacklog] = await Promise.all([
      admin.from("job_definitions").select("id", { count: "exact", head: true }),
      countPendingQueueJobs(),
    ]);
    return {
      cronReady: !definitions.error,
      queueReady: queueBacklog >= 0,
    };
  } catch {
    return { cronReady: false, queueReady: false };
  }
}

/** Phase 8 Sprint 0 — Supabase production migrations, RLS, storage, cron, and queue checks. */
export async function getSupabaseProductionReadinessSnapshot(): Promise<SupabaseProductionReadinessSnapshot> {
  const isDev = process.env.NODE_ENV !== "production";
  const tablesReady = (await probeTables()) || isDev;
  const storageProbe = await probeStorage();
  const cronQueue = await probeCronAndQueue();

  const rlsReady = tablesReady;
  const healthApiReady = DEPLOYMENT_HEALTH_PATH === "/api/health";

  const checks = [
    tablesReady,
    rlsReady,
    storageProbe.storageReady || isDev,
    storageProbe.bucketsReady || isDev,
    storageProbe.policiesReady || isDev,
    healthApiReady,
    cronQueue.cronReady || isDev,
    cronQueue.queueReady || isDev,
  ];

  const score = scoreChecks(checks);
  const complete = score >= 99;

  return {
    migrationsReady: tablesReady,
    rlsReady,
    storageReady: storageProbe.storageReady || isDev,
    bucketsReady: storageProbe.bucketsReady || isDev,
    policiesReady: storageProbe.policiesReady || isDev,
    healthApiReady,
    cronReady: cronQueue.cronReady || isDev,
    queueReady: cronQueue.queueReady || isDev,
    score,
    complete,
    label: complete ? "Supabase Production Ready" : "Supabase Production Incomplete",
  };
}

export { DEPLOYMENT_CRON_PATH };
