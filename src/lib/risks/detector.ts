import { recordRiskActivity } from "@/lib/risks/activity";
import { calculateRiskScore } from "@/lib/risks/scoring";
import { getLatestHealthSnapshot } from "@/lib/health/queries";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientRiskSource, RiskDetectionResult, RiskSeverity } from "@/lib/risks/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import { getClientSlaAssignment } from "@/lib/sla/queries";
import { PORTAL_VISIBLE_REPORT_STATUSES } from "@/lib/reports/types";

type DetectionRule = {
  category: string;
  source: ClientRiskSource;
  title: string;
  severity: RiskSeverity;
  description: string;
  recommendation: string;
  active: boolean;
};

const ACTIVITY_WINDOW_DAYS = 30;
const REPORT_WINDOW_DAYS = 90;
const PORTAL_INACTIVE_DAYS = 45;

async function findOpenRisk(
  organizationId: string,
  clientId: string,
  source: ClientRiskSource,
  category: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_risks")
    .select("id, title, severity, status")
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .eq("source", source)
    .eq("category", category)
    .in("status", OPEN_RISK_STATUSES)
    .maybeSingle();

  return (data as { id: string; title: string; severity: RiskSeverity; status: string } | null) ?? null;
}

async function upsertAutoRisk(
  session: SessionContext,
  clientId: string,
  rule: DetectionRule,
  result: RiskDetectionResult,
): Promise<void> {
  const supabase = await createClient();
  const existing = await findOpenRisk(session.organization.id, clientId, rule.source, rule.category);

  if (rule.active) {
    if (existing) {
      const { error } = await supabase
        .from("client_risks")
        .update({
          title: rule.title,
          description: rule.description,
          severity: rule.severity,
          recommendation: rule.recommendation,
        } as never)
        .eq("id", existing.id);

      if (error) {
        result.errors.push(error.message);
      } else {
        result.updated += 1;
      }
      return;
    }

    const severityImpact =
      rule.severity === "critical" ? 5 : rule.severity === "high" ? 4 : rule.severity === "medium" ? 3 : 2;
    const likelihood = 3;
    const riskScore = calculateRiskScore(likelihood, severityImpact);

    const { data, error } = await supabase
      .from("client_risks")
      .insert({
        organization_id: session.organization.id,
        client_id: clientId,
        title: rule.title,
        description: rule.description,
        severity: rule.severity,
        status: "open",
        source: rule.source,
        category: rule.category,
        recommendation: rule.recommendation,
        owner_user_id: session.user.id,
        likelihood,
        impact_score: severityImpact,
        risk_score: riskScore,
      } as never)
      .select("id")
      .single();

    if (error) {
      result.errors.push(error.message);
      return;
    }

    result.created += 1;
    const riskId = String((data as { id: string }).id);
    void recordRiskActivity({
      organizationId: session.organization.id,
      riskId,
      actorUserId: session.user.id,
      eventType: "risk.detected",
      message: `Risk detected: ${rule.title}`,
      metadata: { clientId, source: rule.source, category: rule.category },
    }).catch(() => undefined);
    return;
  }

  if (existing) {
    const resolvedAt = new Date().toISOString();
    const { error } = await supabase
      .from("client_risks")
      .update({ status: "resolved", resolved_at: resolvedAt } as never)
      .eq("id", existing.id);

    if (error) {
      result.errors.push(error.message);
    } else {
      result.resolved += 1;
    }
  }
}

async function buildRules(
  session: SessionContext,
  clientId: string,
): Promise<DetectionRule[]> {
  const supabase = await createClient();
  const organizationId = session.organization.id;
  const activitySince = new Date();
  activitySince.setDate(activitySince.getDate() - ACTIVITY_WINDOW_DAYS);
  const reportSince = new Date();
  reportSince.setDate(reportSince.getDate() - REPORT_WINDOW_DAYS);
  const portalSince = new Date();
  portalSince.setDate(portalSince.getDate() - PORTAL_INACTIVE_DAYS);

  const [health, activityResult, reportResult, portalResult, clientResult] = await Promise.all([
    getLatestHealthSnapshot(session, clientId),
    supabase
      .from("activity_events")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", activitySince.toISOString())
      .or(`and(entity_type.eq.client,entity_id.eq.${clientId})`),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", PORTAL_VISIBLE_REPORT_STATUSES)
      .gte("published_at", reportSince.toISOString()),
    supabase
      .from("client_portal_users")
      .select("last_login_at")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .eq("is_active", true),
    supabase
      .from("clients")
      .select("sla_policy_id")
      .eq("id", clientId)
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  const clientSla = clientResult.data
    ? await getClientSlaAssignment(
        organizationId,
        (clientResult.data as { sla_policy_id: string | null }).sla_policy_id,
      )
    : { assignedPolicyId: null, effectivePolicy: null, source: "none" as const };

  const activityCount = activityResult.count ?? 0;
  const reportCount = reportResult.count ?? 0;
  const portalUsers = (portalResult.data ?? []) as Array<{ last_login_at: string | null }>;
  const hasRecentPortalLogin = portalUsers.some(
    (user) => user.last_login_at && new Date(user.last_login_at) >= portalSince,
  );
  const hasPortalUsers = portalUsers.length > 0;

  const rules: DetectionRule[] = [];

  rules.push({
    category: "health_critical",
    source: "health_engine",
    title: "Critical client health",
    severity: "critical",
    description: health?.reason ?? "Client health score is in critical range.",
    recommendation: "Review health signals and schedule a client check-in immediately.",
    active: health?.status === "critical",
  });

  rules.push({
    category: "health_watch",
    source: "health_engine",
    title: "Client health requires attention",
    severity: "high",
    description: health?.reason ?? "Client health score is on watch.",
    recommendation: "Investigate contributing factors before health declines further.",
    active: health?.status === "watch",
  });

  rules.push({
    category: "no_activity",
    source: "activity",
    title: "No recent client activity",
    severity: "medium",
    description: `No operational activity recorded in the last ${ACTIVITY_WINDOW_DAYS} days.`,
    recommendation: "Confirm engagement status and schedule a touchpoint with the client.",
    active: activityCount === 0,
  });

  rules.push({
    category: "missing_report",
    source: "report",
    title: "No recent report published",
    severity: "medium",
    description: `No published client report in the last ${REPORT_WINDOW_DAYS} days.`,
    recommendation: "Generate and publish a client report to maintain visibility.",
    active: reportCount === 0,
  });

  rules.push({
    category: "portal_inactive",
    source: "portal",
    title: "Client portal inactive",
    severity: hasPortalUsers ? "medium" : "low",
    description: hasPortalUsers
      ? "Portal users have not signed in recently."
      : "No active portal users configured for this client.",
    recommendation: hasPortalUsers
      ? "Encourage portal login or verify portal access is still needed."
      : "Consider enabling client portal access for transparency.",
    active: hasPortalUsers ? !hasRecentPortalLogin : true,
  });

  rules.push({
    category: "sla_missing",
    source: "sla",
    title: "No SLA policy assigned",
    severity: "medium",
    description: "This client has no effective SLA policy.",
    recommendation: "Assign an SLA policy to set response-time expectations.",
    active: clientSla.source === "none",
  });

  return rules;
}

/** Detect and upsert automatic client risks — never throws. */
export async function detectClientRisks(
  session: SessionContext,
  clientId: string,
): Promise<RiskDetectionResult> {
  const result: RiskDetectionResult = { created: 0, updated: 0, resolved: 0, errors: [] };

  try {
    const rules = await buildRules(session, clientId);
    for (const rule of rules) {
      await upsertAutoRisk(session, clientId, rule, result);
    }
  } catch (error) {
    console.warn("[risks] detectClientRisks failed:", error);
    result.errors.push("Risk detection failed.");
  }

  return result;
}

/** Resolve health_engine auto risks when health improves. */
export async function resolveHealthEngineRisks(
  session: SessionContext,
  clientId: string,
): Promise<void> {
  try {
    const supabase = await createClient();
    const resolvedAt = new Date().toISOString();
    await supabase
      .from("client_risks")
      .update({ status: "resolved", resolved_at: resolvedAt } as never)
      .eq("organization_id", session.organization.id)
      .eq("client_id", clientId)
      .eq("source", "health_engine")
      .in("status", OPEN_RISK_STATUSES);
  } catch (error) {
    console.warn("[risks] resolveHealthEngineRisks failed:", error);
  }
}
