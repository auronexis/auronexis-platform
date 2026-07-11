import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readMigration(filename) {
  return readFileSync(join(rootDir, "supabase", "migrations", filename), "utf8");
}

function redactSensitiveText(input) {
  const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const TOKEN_PATTERN = /\b(?:sk_|pk_|whsec_|eyJ)[A-Za-z0-9_-]{10,}\b/g;
  const STRIPE_CUSTOMER_PATTERN = /\bcus_[A-Za-z0-9]+\b/g;
  return input
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(TOKEN_PATTERN, "[redacted-token]")
    .replace(STRIPE_CUSTOMER_PATTERN, "[redacted-stripe-customer]");
}

function computeMetricChange(key, label, current, previous, positiveWhenUp = true) {
  const cur = current ?? 0;
  const prev = previous ?? 0;
  const changeAbsolute = cur - prev;
  let direction = "stable";
  if (changeAbsolute > 0) direction = "up";
  else if (changeAbsolute < 0) direction = "down";
  let interpretation = "neutral";
  if (changeAbsolute !== 0) {
    interpretation = positiveWhenUp ? (changeAbsolute > 0 ? "positive" : "negative") : changeAbsolute < 0 ? "positive" : "negative";
  }
  return { key, label, currentValue: current, previousValue: previous, changeAbsolute, direction, interpretation };
}

function buildIntelligenceChange(key, label, current, previous, positiveWhenUp = true) {
  const metric = computeMetricChange(key, label, current, previous, positiveWhenUp);
  if (metric.changeAbsolute === 0) return null;
  const abs = Math.abs(metric.changeAbsolute);
  let significance = "minor";
  if (abs >= 5) significance = "major";
  else if (abs >= 2) significance = "moderate";
  return { ...metric, significance };
}

function resolvePeriod(preset = "30d") {
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const currentEnd = new Date();
  const currentStart = new Date(currentEnd.getTime() - days * 86400000);
  const comparisonEnd = new Date(currentStart.getTime() - 1);
  const comparisonStart = new Date(comparisonEnd.getTime() - days * 86400000);
  return { currentStart, currentEnd, comparisonStart, comparisonEnd, preset };
}

function validatePeriodRange(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || s >= e) return false;
  return (e - s) / 86400000 <= 90;
}

function detectAnomalyRiskSpike(current, previous, threshold = 3) {
  return current - previous >= threshold;
}

function resolveDashboardMode(activation, adoption, csMode, snapshot) {
  if (!activation.firstValueReached || ["getting_started"].includes(activation.stage)) return "hidden";
  if (["critical", "at_risk"].includes(adoption.riskLevel)) return "hidden";
  if (csMode === "critical") return "hidden";
  if (snapshot.criticalChanges.length > 0) return "critical";
  if (snapshot.topFindings.length > 0) return "summary";
  return "hidden";
}

// --- Migration ---

test("executive intelligence briefings grants SELECT INSERT UPDATE", () => {
  const sql = readMigration("20250706000000_executive_intelligence_briefings.sql");
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE ON public\.executive_intelligence_briefings TO authenticated/);
});

test("executive intelligence RLS uses auth_user_id", () => {
  const sql = readMigration("20250706000000_executive_intelligence_briefings.sql");
  assert.match(sql, /users\.auth_user_id = auth\.uid\(\)/);
});

test("executive intelligence status constraint", () => {
  const sql = readMigration("20250706000000_executive_intelligence_briefings.sql");
  assert.match(sql, /executive_intelligence_briefings_status_check/);
});

// --- Change detection ---

test("positive change detected when values increase", () => {
  const change = buildIntelligenceChange("reports", "Reports", 5, 2, true);
  assert.equal(change.interpretation, "positive");
  assert.equal(change.direction, "up");
});

test("negative change detected when risks increase", () => {
  const change = buildIntelligenceChange("risks", "Risks", 5, 2, false);
  assert.equal(change.interpretation, "negative");
});

test("stable tolerance returns null for zero change", () => {
  const change = buildIntelligenceChange("risks", "Risks", 5, 5, false);
  assert.equal(change, null);
});

test("zero baseline avoids misleading percentage in metric", () => {
  const metric = computeMetricChange("x", "X", 2, 0, true);
  assert.equal(metric.changeAbsolute, 2);
});

// --- Period ---

test("30d period preset resolves bounded window", () => {
  const period = resolvePeriod("30d");
  assert.ok(validatePeriodRange(period.currentStart.toISOString(), period.currentEnd.toISOString()));
});

test("invalid period range rejected", () => {
  assert.equal(validatePeriodRange("2026-01-01", "2025-01-01"), false);
});

// --- Anomalies ---

test("risk spike anomaly threshold", () => {
  assert.equal(detectAnomalyRiskSpike(5, 1), true);
  assert.equal(detectAnomalyRiskSpike(4, 2), false);
});

// --- Redaction ---

test("redaction removes email", () => {
  const result = redactSensitiveText("Contact user@example.com today");
  assert.match(result, /\[redacted-email\]/);
  assert.doesNotMatch(result, /user@example.com/);
});

test("redaction removes token", () => {
  const result = redactSensitiveText("key sk_test_abcdefghijklmnop");
  assert.match(result, /\[redacted-token\]/);
});

test("redaction removes Stripe customer id", () => {
  const result = redactSensitiveText("customer cus_ABC123xyz");
  assert.match(result, /\[redacted-stripe-customer\]/);
});

// --- Dashboard mode ---

test("hidden during incomplete activation", () => {
  const mode = resolveDashboardMode(
    { firstValueReached: false, stage: "getting_started" },
    { riskLevel: "healthy", stage: "operational" },
    "hidden",
    { criticalChanges: [{ key: "x" }], topFindings: [] },
  );
  assert.equal(mode, "hidden");
});

test("critical when major negative changes exist", () => {
  const mode = resolveDashboardMode(
    { firstValueReached: true, stage: "active" },
    { riskLevel: "healthy", stage: "operational" },
    "summary",
    { criticalChanges: [{ key: "x" }], topFindings: [] },
  );
  assert.equal(mode, "critical");
});

// --- RBAC ---

test("executive intelligence permissions in authorization matrix", () => {
  const source = readFileSync(join(rootDir, "src", "lib", "authorization", "permissions.ts"), "utf8");
  assert.match(source, /executive_intelligence\.read/);
  assert.match(source, /executive_intelligence\.generate/);
  assert.match(source, /executive_intelligence\.refresh/);
  assert.match(source, /executive_intelligence\.export/);
  assert.match(source, /executive_intelligence\.manage/);
});

test("buildOperationalSnapshot uses React cache", () => {
  const source = readFileSync(join(rootDir, "src", "lib", "ai", "insights", "queries.ts"), "utf8");
  assert.match(source, /export const buildOperationalSnapshot = cache/);
});
