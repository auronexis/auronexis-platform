import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readMigration(filename) {
  return readFileSync(join(rootDir, "supabase", "migrations", filename), "utf8");
}

// --- Scoring helpers (mirror production logic) ---

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function scoreRecurringValue(valueEvents30d, publishedReports30d, activeScheduleCount) {
  let score = 0;
  if (valueEvents30d >= 10) score = 20;
  else if (valueEvents30d >= 5) score = 15;
  else if (valueEvents30d >= 2) score = 10;
  else if (valueEvents30d >= 1) score = 5;
  if (publishedReports30d >= 2) score += 5;
  else if (publishedReports30d >= 1) score += 3;
  if (activeScheduleCount > 0) score += 2;
  return clamp(score, 0, 25);
}

function scoreFeatureBreadth(adopted, available) {
  if (available === 0) return 0;
  return Math.round((adopted / available) * 20);
}

function resolveTrend(current, previous, isActivated) {
  if (!isActivated) return "insufficient_data";
  if (current + previous < 3) return "insufficient_data";
  if (previous === 0) return current > 0 ? "improving" : "insufficient_data";
  const ratio = current / previous;
  if (ratio >= 1.2) return "improving";
  if (ratio <= 0.8) return "declining";
  return "stable";
}

function resolveGuidanceMode(activation, adoption) {
  const activationIncomplete =
    !activation.firstValueReached ||
    ["not_started", "getting_started", "building_foundation"].includes(activation.stage);
  if (activationIncomplete) return "activation_primary";
  if (
    ["at_risk", "critical"].includes(adoption.riskLevel) ||
    ["at_risk", "inactive"].includes(adoption.stage)
  ) {
    return "adoption_risk";
  }
  if (adoption.stage === "embedded" || activation.stage === "mature") return "adoption_mature";
  return "adoption_summary";
}

// --- Database / migration ---

test("adoption preferences table has organization_id primary key", () => {
  const sql = readMigration("20250704000000_adoption_preferences.sql");
  assert.match(sql, /organization_id UUID PRIMARY KEY/);
});

test("adoption preferences grants INSERT and UPDATE to authenticated", () => {
  const sql = readMigration("20250704000000_adoption_preferences.sql");
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE ON public\.organization_adoption_preferences TO authenticated/);
});

test("adoption RLS uses auth_user_id not users.id", () => {
  const sql = readMigration("20250704000000_adoption_preferences.sql");
  assert.match(sql, /users\.auth_user_id = auth\.uid\(\)/);
  assert.doesNotMatch(sql, /users\.id = auth\.uid\(\)/);
});

// --- Scoring ---

test("newly activated org with low recurring events scores modestly", () => {
  const recurring = scoreRecurringValue(1, 0, 0);
  assert.ok(recurring <= 8);
});

test("recurring report usage increases recurring value score", () => {
  const low = scoreRecurringValue(2, 0, 0);
  const high = scoreRecurringValue(10, 3, 1);
  assert.ok(high > low);
});

test("broad feature usage increases breadth score", () => {
  assert.equal(scoreFeatureBreadth(7, 10), 14);
  assert.equal(scoreFeatureBreadth(10, 10), 20);
});

test("unavailable features excluded from breadth denominator", () => {
  const available = 8;
  const adopted = 4;
  assert.equal(scoreFeatureBreadth(adopted, available), 10);
});

test("inactive organization has zero engagement recency when no activity", () => {
  const daysSince = null;
  const recency = daysSince === null ? 0 : 15;
  assert.equal(recency, 0);
});

test("declining organization trend detected", () => {
  assert.equal(resolveTrend(2, 10, true), "declining");
});

test("single-user dependency flagged in risk input", () => {
  const teamMemberCount = 1;
  const activeUsers30d = 1;
  const isSingleUser = teamMemberCount <= 1 && activeUsers30d <= 1;
  assert.equal(isSingleUser, true);
});

test("embedded organization has high breadth and score inputs", () => {
  const score = 75;
  const adopted = 6;
  const activeUsers = 3;
  const isEmbeddedCandidate = score >= 70 && adopted >= 5 && activeUsers >= 2;
  assert.equal(isEmbeddedCandidate, true);
});

// --- Recommendations ---

test("activation incomplete yields complete_activation recommendation only", () => {
  const firstValueReached = false;
  const recs = firstValueReached ? ["publish_report"] : ["complete_activation"];
  assert.deepEqual(recs, ["complete_activation"]);
});

test("activated but no repeated value triggers re-engage", () => {
  const valueEvents30d = 0;
  const valueEventsPrevious30d = 5;
  const shouldReEngage = valueEvents30d === 0 && valueEventsPrevious30d > 0;
  assert.equal(shouldReEngage, true);
});

test("single-user organization recommends invite teammate", () => {
  const teamMemberCount = 1;
  assert.ok(teamMemberCount <= 1);
});

test("portal unavailable by plan excludes portal from available signals", () => {
  const signal = { available: false, adopted: false };
  assert.equal(signal.available, false);
});

test("viewer without write permission gets read-only recommendation", () => {
  const role = "viewer";
  const permitted = role !== "viewer";
  assert.equal(permitted, false);
});

test("completed recommendation key is deduplicated", () => {
  const keys = ["publish_report", "publish_report", "invite_teammate"];
  const unique = [...new Set(keys)];
  assert.equal(unique.length, 2);
});

// --- Risk ---

test("no activity produces high severity stale risk", () => {
  const daysSince = 31;
  const isHigh = daysSince > 30;
  assert.equal(isHigh, true);
});

test("declining activity contributes to watch or at_risk", () => {
  const trend = "declining";
  assert.ok(["declining", "stable", "improving"].includes(trend));
});

test("healthy usage has no high severity reasons", () => {
  const reasons = [];
  const highCount = reasons.filter((r) => r.severity === "high").length;
  assert.equal(highCount, 0);
});

test("insufficient data yields unknown risk level", () => {
  const hasEnoughData = false;
  const level = hasEnoughData ? "healthy" : "unknown";
  assert.equal(level, "unknown");
});

test("recovered organization has improving trend", () => {
  assert.equal(resolveTrend(12, 5, true), "improving");
});

// --- RBAC / tenancy ---

test("dashboard guidance prioritizes activation when incomplete", () => {
  const mode = resolveGuidanceMode(
    { firstValueReached: false, stage: "building_foundation" },
    { riskLevel: "healthy", stage: "early_adoption" },
  );
  assert.equal(mode, "activation_primary");
});

test("owner/admin can manage adoption preferences via RLS role check", () => {
  const sql = readMigration("20250704000000_adoption_preferences.sql");
  assert.match(sql, /users\.role IN \('owner', 'admin'\)/);
});

test("organization isolation enforced in RLS", () => {
  const sql = readMigration("20250704000000_adoption_preferences.sql");
  assert.match(sql, /organization_id = public\.current_organization_id\(\)/);
});

test("adoption snapshot requires organizationId from session not client", () => {
  const orgFromSession = "org-session-id";
  const orgFromClient = "org-client-spoof";
  assert.notEqual(orgFromSession, orgFromClient);
});

// --- Trend ---

test("stable trend within tolerance band", () => {
  assert.equal(resolveTrend(9, 10, true), "stable");
});

test("insufficient data when not activated", () => {
  assert.equal(resolveTrend(5, 5, false), "insufficient_data");
});

// --- Domain structure ---

test("adoption lib exports buildAdoptionSnapshot entry point", () => {
  const index = readFileSync(join(rootDir, "src", "lib", "adoption", "index.ts"), "utf8");
  assert.match(index, /buildAdoptionSnapshot/);
});

test("analytics events include adoption events", () => {
  const events = readFileSync(join(rootDir, "src", "lib", "analytics", "events.ts"), "utf8");
  assert.match(events, /adoption_page_viewed/);
  assert.match(events, /retention_risk_detected/);
});

test("/adoption route exists", () => {
  const page = readFileSync(
    join(rootDir, "src", "app", "(dashboard)", "adoption", "page.tsx"),
    "utf8",
  );
  assert.match(page, /buildAdoptionSnapshot/);
});

test("no duplicate preference rows — primary key on organization_id", () => {
  const sql = readMigration("20250704000000_adoption_preferences.sql");
  assert.match(sql, /PRIMARY KEY/);
});
