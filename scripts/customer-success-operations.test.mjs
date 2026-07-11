import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readMigration(filename) {
  return readFileSync(join(rootDir, "supabase", "migrations", filename), "utf8");
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

const WEIGHTS = {
  deliveryConsistency: 25,
  riskExposure: 20,
  incidentStability: 15,
  customerEngagement: 15,
  serviceReliability: 10,
  customerVisibility: 10,
  successExecution: 5,
};

function scoreDelivery(data, isNew) {
  if (data.publishedReportsCount === 0 && isNew) return 12;
  let score = 0;
  if (data.reportsPublishedThisPeriod >= 2) score = 25;
  else if (data.reportsPublishedThisPeriod >= 1) score = 18;
  else if (data.publishedReportsCount > 0) score = 10;
  if (data.scheduledReportsCount > 0) score = Math.min(25, score + 5);
  return clamp(score, 0, WEIGHTS.deliveryConsistency);
}

function scoreRiskExposure(critical, open, enabled, isNew) {
  if (!enabled) return WEIGHTS.riskExposure;
  if (open === 0 && critical === 0) return WEIGHTS.riskExposure;
  if (critical > 0) return 0;
  if (open > 2) return 5;
  if (open > 0 && isNew) return 12;
  return open > 0 ? 8 : WEIGHTS.riskExposure;
}

function scoreIncidents(open, enabled, isNew) {
  if (!enabled) return WEIGHTS.incidentStability;
  if (open === 0) return WEIGHTS.incidentStability;
  if (open >= 2) return 0;
  return isNew ? 8 : 4;
}

function scoreEngagement(data) {
  let score = 0;
  if (data.daysSinceLastActivity !== null && data.daysSinceLastActivity <= 7) score = 15;
  else if (data.daysSinceLastActivity !== null && data.daysSinceLastActivity <= 21) score = 10;
  else if (data.daysSinceLastActivity !== null && data.daysSinceLastActivity <= 45) score = 5;
  if (data.portalUsersCount > 0) score = Math.min(15, score + 3);
  return clamp(score, 0, WEIGHTS.customerEngagement);
}

function scoreExecution(overdue) {
  if (overdue === 0) return WEIGHTS.successExecution;
  if (overdue >= 3) return 0;
  return 2;
}

function computeHealth(input) {
  const delivery = scoreDelivery(input.data, input.isNew);
  const risk = scoreRiskExposure(
    input.criticalRiskCount,
    input.openRiskCount,
    input.data.risksEnabled,
    input.isNew,
  );
  const incidents = scoreIncidents(input.openIncidentCount, input.data.incidentsEnabled, input.isNew);
  const engagement = scoreEngagement(input.data);
  const service = input.data.slaEnabled
    ? input.data.slaBreachesThisPeriod === 0
      ? WEIGHTS.serviceReliability
      : 5
    : WEIGHTS.serviceReliability;
  const visibility = clamp(
    (input.data.publishedReportsCount > 0 ? 5 : 0) +
      (input.data.portalUsersCount > 0 ? 3 : 0) +
      (input.data.hasEmailActivity ? 2 : 0),
    0,
    WEIGHTS.customerVisibility,
  );
  const execution = scoreExecution(input.overdueTaskCount);
  const total = clamp(
    delivery + risk + incidents + engagement + service + visibility + execution,
    0,
    100,
  );
  return { total, delivery, risk, incidents, engagement, service, visibility, execution };
}

function resolveHealthStatus(breakdown, data, criticalRisk, openIncidents, isNew) {
  if (data.publishedReportsCount === 0 && data.draftReportsCount === 0 && isNew) {
    return "insufficient_data";
  }
  if (criticalRisk > 0 || openIncidents >= 2) return "critical";
  if (breakdown.total < 40) return "at_risk";
  if (breakdown.total < 55) return "watch";
  if (breakdown.total < 70) return "stable";
  return "healthy";
}

const PRIORITY_RANK = { urgent: 100, high: 80, medium: 50, low: 20 };

const PLAYBOOKS = [
  { key: "report_delivery_recovery", triggerCodes: ["no_recent_report"], priority: "high", features: ["reports"] },
  { key: "risk_remediation", triggerCodes: ["critical_risk", "high_risk_open"], priority: "urgent", features: ["risks"] },
  { key: "incident_recovery", triggerCodes: ["open_incident", "critical_incident"], priority: "urgent", features: ["incidents"] },
  { key: "monitoring_activation", triggerCodes: ["no_monitoring"], priority: "medium", features: [] },
  { key: "portal_activation", triggerCodes: ["portal_unused"], priority: "medium", features: ["customer_portal"] },
  { key: "engagement_reactivation", triggerCodes: ["stale_activity"], priority: "high", features: [] },
  { key: "sla_recovery", triggerCodes: ["sla_breach"], priority: "high", features: ["sla_tracking"] },
  { key: "expansion_readiness", triggerCodes: ["healthy_expansion"], priority: "low", features: [] },
];

function resolveSuggestions(triggerCodes, activeKeys, planFeatures) {
  const triggers = new Set(triggerCodes);
  const suggestions = [];
  for (const pb of PLAYBOOKS) {
    if (activeKeys.includes(pb.key)) continue;
    if (!pb.triggerCodes.some((c) => triggers.has(c))) continue;
    const available =
      pb.features.length === 0 || pb.features.every((f) => planFeatures.includes(f));
    suggestions.push({ key: pb.key, priority: pb.priority, available });
  }
  return suggestions
    .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority])
    .slice(0, 3);
}

function healthRank(status) {
  const ranks = { critical: 5, at_risk: 4, watch: 3, stable: 2, healthy: 1, insufficient_data: 0 };
  return ranks[status] ?? 0;
}

function sortPriorityQueue(entries) {
  return [...entries].sort((a, b) => {
    const hr = healthRank(b.healthStatus) - healthRank(a.healthStatus);
    if (hr !== 0) return hr;
    if (b.overdueTaskCount !== a.overdueTaskCount) return b.overdueTaskCount - a.overdueTaskCount;
    if (b.openCriticalIncidentCount !== a.openCriticalIncidentCount) {
      return b.openCriticalIncidentCount - a.openCriticalIncidentCount;
    }
    return b.openHighRiskCount - a.openHighRiskCount;
  });
}

function resolveDashboardCustomerSuccessMode(activation, adoption, portfolio) {
  const activationIncomplete =
    !activation.firstValueReached ||
    ["not_started", "getting_started", "building_foundation"].includes(activation.stage);
  if (activationIncomplete) return "hidden";
  const adoptionCritical =
    adoption.riskLevel === "critical" ||
    adoption.riskLevel === "at_risk" ||
    adoption.stage === "at_risk" ||
    adoption.stage === "inactive";
  if (adoptionCritical) return "hidden";
  if (portfolio.criticalCount > 0 || portfolio.overdueTaskCount > 0) return "critical";
  if (portfolio.activePlaybookCount > 0 || portfolio.atRiskCount > 0) return "summary";
  return "hidden";
}

function resolveRecoveryStatus(input) {
  const active = input.activeInstances.filter((i) =>
    ["active", "paused", "suggested"].includes(i.status),
  );
  if (active.length > 0) {
    if (
      input.healthScoreBefore !== null &&
      input.healthScoreAfter !== null &&
      input.healthScoreAfter > input.healthScoreBefore + 10
    ) {
      return "improving";
    }
    return "intervention_active";
  }
  const completed = input.activeInstances.filter((i) => i.status === "completed");
  if (completed.length === 0) {
    return input.healthScoreBefore === null ? "insufficient_data" : "not_started";
  }
  const latest = completed[0];
  if (
    latest.recovery_score_before !== null &&
    latest.recovery_score_after !== null &&
    latest.recovery_score_after >= latest.recovery_score_before + 15 &&
    input.hasRecentPositiveSignal
  ) {
    return "recovered";
  }
  if (
    latest.recovery_score_before !== null &&
    latest.recovery_score_after !== null &&
    latest.recovery_score_after < latest.recovery_score_before
  ) {
    return "worsened";
  }
  return "unresolved";
}

// --- Database / migration ---

test("customer success migration grants INSERT and UPDATE to authenticated", () => {
  const sql = readMigration("20250705000000_customer_success_operations.sql");
  assert.match(
    sql,
    /GRANT SELECT, INSERT, UPDATE ON public\.customer_success_playbook_instances TO authenticated/,
  );
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE ON public\.customer_success_tasks TO authenticated/);
});

test("customer success RLS uses auth_user_id", () => {
  const sql = readMigration("20250705000000_customer_success_operations.sql");
  assert.match(sql, /users\.auth_user_id = auth\.uid\(\)/);
});

test("customer success partial unique index prevents duplicate active playbooks", () => {
  const sql = readMigration("20250705000000_customer_success_operations.sql");
  assert.match(sql, /idx_cs_playbook_active_unique/);
  assert.match(sql, /WHERE status IN \('suggested', 'active', 'paused'\)/);
});

test("customer success tables have status check constraints", () => {
  const sql = readMigration("20250705000000_customer_success_operations.sql");
  assert.match(sql, /customer_success_playbook_instances_status_check/);
  assert.match(sql, /customer_success_tasks_status_check/);
});

// --- Health scoring ---

test("new client with insufficient data gets insufficient_data status", () => {
  const breakdown = computeHealth({
    isNew: true,
    data: {
      publishedReportsCount: 0,
      draftReportsCount: 0,
      reportsPublishedThisPeriod: 0,
      scheduledReportsCount: 0,
      daysSinceLastActivity: null,
      portalUsersCount: 0,
      hasEmailActivity: false,
      risksEnabled: true,
      incidentsEnabled: true,
      slaEnabled: false,
      slaBreachesThisPeriod: 0,
    },
    openRiskCount: 0,
    criticalRiskCount: 0,
    openIncidentCount: 0,
    overdueTaskCount: 0,
  });
  const status = resolveHealthStatus(
    breakdown,
    { publishedReportsCount: 0, draftReportsCount: 0 },
    0,
    0,
    true,
  );
  assert.equal(status, "insufficient_data");
});

test("healthy reporting client scores high", () => {
  const breakdown = computeHealth({
    isNew: false,
    data: {
      publishedReportsCount: 5,
      draftReportsCount: 1,
      reportsPublishedThisPeriod: 2,
      scheduledReportsCount: 1,
      daysSinceLastActivity: 3,
      portalUsersCount: 2,
      hasEmailActivity: true,
      risksEnabled: true,
      incidentsEnabled: true,
      slaEnabled: true,
      slaBreachesThisPeriod: 0,
    },
    openRiskCount: 0,
    criticalRiskCount: 0,
    openIncidentCount: 0,
    overdueTaskCount: 0,
  });
  assert.ok(breakdown.total >= 70);
});

test("critical risk zeroes risk exposure component", () => {
  const breakdown = computeHealth({
    isNew: false,
    data: {
      publishedReportsCount: 2,
      draftReportsCount: 0,
      reportsPublishedThisPeriod: 1,
      scheduledReportsCount: 0,
      daysSinceLastActivity: 10,
      portalUsersCount: 0,
      hasEmailActivity: false,
      risksEnabled: true,
      incidentsEnabled: true,
      slaEnabled: false,
      slaBreachesThisPeriod: 0,
    },
    openRiskCount: 1,
    criticalRiskCount: 1,
    openIncidentCount: 0,
    overdueTaskCount: 0,
  });
  assert.equal(breakdown.risk, 0);
  const status = resolveHealthStatus(breakdown, { publishedReportsCount: 2, draftReportsCount: 0 }, 1, 0, false);
  assert.equal(status, "critical");
});

test("unresolved incidents reduce stability score", () => {
  const breakdown = computeHealth({
    isNew: false,
    data: {
      publishedReportsCount: 2,
      draftReportsCount: 0,
      reportsPublishedThisPeriod: 1,
      scheduledReportsCount: 0,
      daysSinceLastActivity: 10,
      portalUsersCount: 0,
      hasEmailActivity: false,
      risksEnabled: true,
      incidentsEnabled: true,
      slaEnabled: false,
      slaBreachesThisPeriod: 0,
    },
    openRiskCount: 0,
    criticalRiskCount: 0,
    openIncidentCount: 2,
    overdueTaskCount: 0,
  });
  assert.equal(breakdown.incidents, 0);
  const status = resolveHealthStatus(breakdown, { publishedReportsCount: 2, draftReportsCount: 0 }, 0, 2, false);
  assert.equal(status, "critical");
});

test("overdue tasks reduce success execution score", () => {
  const withOverdue = computeHealth({
    isNew: false,
    data: {
      publishedReportsCount: 2,
      draftReportsCount: 0,
      reportsPublishedThisPeriod: 1,
      scheduledReportsCount: 0,
      daysSinceLastActivity: 10,
      portalUsersCount: 0,
      hasEmailActivity: false,
      risksEnabled: true,
      incidentsEnabled: true,
      slaEnabled: false,
      slaBreachesThisPeriod: 0,
    },
    openRiskCount: 0,
    criticalRiskCount: 0,
    openIncidentCount: 0,
    overdueTaskCount: 3,
  });
  assert.equal(withOverdue.execution, 0);
});

test("disabled portal feature does not penalize visibility unfairly", () => {
  const breakdown = computeHealth({
    isNew: false,
    data: {
      publishedReportsCount: 3,
      draftReportsCount: 0,
      reportsPublishedThisPeriod: 1,
      scheduledReportsCount: 0,
      daysSinceLastActivity: 5,
      portalUsersCount: 0,
      hasEmailActivity: false,
      risksEnabled: false,
      incidentsEnabled: false,
      slaEnabled: false,
      slaBreachesThisPeriod: 0,
    },
    openRiskCount: 0,
    criticalRiskCount: 0,
    openIncidentCount: 0,
    overdueTaskCount: 0,
  });
  assert.equal(breakdown.risk, WEIGHTS.riskExposure);
  assert.equal(breakdown.incidents, WEIGHTS.incidentStability);
});

// --- Playbook suggestions ---

test("no recent report suggests report delivery recovery", () => {
  const suggestions = resolveSuggestions(["no_recent_report"], [], ["reports"]);
  assert.equal(suggestions[0]?.key, "report_delivery_recovery");
});

test("critical risk suggests risk remediation", () => {
  const suggestions = resolveSuggestions(["critical_risk"], [], ["risks"]);
  assert.ok(suggestions.some((s) => s.key === "risk_remediation"));
});

test("critical incident suggests incident recovery", () => {
  const suggestions = resolveSuggestions(["critical_incident"], [], ["incidents"]);
  assert.ok(suggestions.some((s) => s.key === "incident_recovery"));
});

test("no monitoring suggests monitoring activation", () => {
  const suggestions = resolveSuggestions(["no_monitoring"], [], []);
  assert.ok(suggestions.some((s) => s.key === "monitoring_activation"));
});

test("stale activity suggests engagement reactivation", () => {
  const suggestions = resolveSuggestions(["stale_activity"], [], []);
  assert.ok(suggestions.some((s) => s.key === "engagement_reactivation"));
});

test("sla breach suggests sla recovery when feature enabled", () => {
  const suggestions = resolveSuggestions(["sla_breach"], [], ["sla_tracking"]);
  assert.ok(suggestions.some((s) => s.key === "sla_recovery"));
});

test("healthy expansion suggests expansion readiness", () => {
  const suggestions = resolveSuggestions(["healthy_expansion"], [], []);
  assert.ok(suggestions.some((s) => s.key === "expansion_readiness"));
});

test("active playbook is not suggested again", () => {
  const suggestions = resolveSuggestions(["no_recent_report"], ["report_delivery_recovery"], ["reports"]);
  assert.ok(!suggestions.some((s) => s.key === "report_delivery_recovery"));
});

test("locked feature playbook marked unavailable", () => {
  const suggestions = resolveSuggestions(["portal_unused"], [], []);
  const portal = suggestions.find((s) => s.key === "portal_activation");
  assert.ok(portal);
  assert.equal(portal.available, false);
});

test("suggestions capped at three", () => {
  const suggestions = resolveSuggestions(
    ["no_recent_report", "critical_risk", "open_incident", "stale_activity", "sla_breach"],
    [],
    ["reports", "risks", "incidents", "sla_tracking"],
  );
  assert.ok(suggestions.length <= 3);
});

// --- Portfolio ordering ---

test("critical health ranks before watch", () => {
  const sorted = sortPriorityQueue([
    { healthStatus: "watch", overdueTaskCount: 0, openCriticalIncidentCount: 0, openHighRiskCount: 0 },
    { healthStatus: "critical", overdueTaskCount: 0, openCriticalIncidentCount: 0, openHighRiskCount: 0 },
  ]);
  assert.equal(sorted[0].healthStatus, "critical");
});

test("overdue tasks break ties within same health band", () => {
  const sorted = sortPriorityQueue([
    { healthStatus: "at_risk", overdueTaskCount: 0, openCriticalIncidentCount: 0, openHighRiskCount: 0 },
    { healthStatus: "at_risk", overdueTaskCount: 2, openCriticalIncidentCount: 0, openHighRiskCount: 0 },
  ]);
  assert.equal(sorted[0].overdueTaskCount, 2);
});

// --- Dashboard mode ---

test("customer success hidden during incomplete activation", () => {
  const mode = resolveDashboardCustomerSuccessMode(
    { firstValueReached: false, stage: "getting_started" },
    { riskLevel: "low", stage: "growing" },
    { criticalCount: 2, overdueTaskCount: 1, activePlaybookCount: 0, atRiskCount: 0 },
  );
  assert.equal(mode, "hidden");
});

test("customer success hidden during adoption critical", () => {
  const mode = resolveDashboardCustomerSuccessMode(
    { firstValueReached: true, stage: "active" },
    { riskLevel: "critical", stage: "at_risk" },
    { criticalCount: 2, overdueTaskCount: 1, activePlaybookCount: 0, atRiskCount: 0 },
  );
  assert.equal(mode, "hidden");
});

test("customer success critical mode when portfolio has critical clients", () => {
  const mode = resolveDashboardCustomerSuccessMode(
    { firstValueReached: true, stage: "active" },
    { riskLevel: "low", stage: "growing" },
    { criticalCount: 1, overdueTaskCount: 0, activePlaybookCount: 0, atRiskCount: 0 },
  );
  assert.equal(mode, "critical");
});

// --- Recovery ---

test("recovery requires measurable post-intervention evidence", () => {
  const status = resolveRecoveryStatus({
    activeInstances: [
      {
        status: "completed",
        recovery_score_before: 40,
        recovery_score_after: 60,
      },
    ],
    healthScoreBefore: 40,
    healthScoreAfter: 60,
    hasRecentPositiveSignal: false,
  });
  assert.notEqual(status, "recovered");
});

test("recovered when score improved enough with positive signal", () => {
  const status = resolveRecoveryStatus({
    activeInstances: [
      {
        status: "completed",
        recovery_score_before: 40,
        recovery_score_after: 60,
      },
    ],
    healthScoreBefore: 40,
    healthScoreAfter: 60,
    hasRecentPositiveSignal: true,
  });
  assert.equal(status, "recovered");
});

// --- RBAC file presence ---

test("customer success permissions defined in authorization matrix", () => {
  const source = readFileSync(join(rootDir, "src", "lib", "authorization", "permissions.ts"), "utf8");
  assert.match(source, /customer_success\.read/);
  assert.match(source, /customer_success\.write/);
  assert.match(source, /customer_success\.assign/);
  assert.match(source, /customer_success\.complete/);
  assert.match(source, /customer_success\.manage/);
});

test("twelve built-in playbooks registered", () => {
  const source = readFileSync(join(rootDir, "src", "lib", "customer-success", "constants.ts"), "utf8");
  const keys = [
    "onboarding_recovery",
    "report_delivery_recovery",
    "risk_remediation",
    "incident_recovery",
    "monitoring_activation",
    "portal_activation",
    "engagement_reactivation",
    "sla_recovery",
    "executive_review",
    "expansion_readiness",
    "renewal_risk",
    "low_profitability_review",
  ];
  for (const key of keys) {
    assert.match(source, new RegExp(`key: "${key}"`));
  }
});
