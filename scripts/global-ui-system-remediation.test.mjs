/**
 * Regression: global themed native selects + Ctrl+K search coverage.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function section(title) {
  console.log(`\n== ${title} ==`);
}

section("Native select theme tokens");
{
  const tokens = readSource("src/lib/ui/form-tokens.ts");
  const globals = readSource("src/app/globals.css");
  const selectUi = readSource("src/components/ui/select.tsx");
  assert.match(tokens, /nativeSelectControl/);
  assert.match(tokens, /\[&>option\]:bg-surface/);
  assert.match(tokens, /\[&>option\]:text-foreground/);
  assert.match(globals, /select option/);
  assert.match(globals, /html\.dark select/);
  assert.match(selectUi, /nativeSelectControl/);
  console.log("PASS theme tokens + shared Select");
}

section("Compliance / profile use theme-safe selects");
{
  const compliance = readSource("src/components/compliance/compliance-workspace.tsx");
  const profile = readSource("src/components/profile/profile-section-controls.tsx");
  assert.match(compliance, /nativeSelectControl/);
  assert.doesNotMatch(
    compliance,
    /<select[^>]*className="[^"]*border border-border[^"]*"\s*>/,
  );
  assert.match(profile, /nativeSelectControl/);
  console.log("PASS compliance + profile selects");
}

section("Workspace search derives PRIMARY_NAV + Settings hub");
{
  const searchSource = readSource("src/lib/layout/workspace-search.ts");
  const settingsDest = readSource("src/lib/layout/settings-nav-destinations.ts");
  const settingsPage = readSource("src/app/(dashboard)/settings/page.tsx");
  const navSource = readSource("src/lib/tenancy/context.ts");

  assert.match(searchSource, /PRIMARY_NAV/);
  assert.match(searchSource, /entriesFromPrimaryNav/);
  assert.match(searchSource, /SETTINGS_NAV_DESTINATIONS/);
  assert.match(searchSource, /entriesFromSettingsNav/);
  assert.match(searchSource, /getCanonicalSearchableHrefs/);
  assert.match(settingsPage, /SETTINGS_NAV_DESTINATIONS/);

  for (const href of [
    "/profile",
    "/dashboard/compliance",
    "/dashboard/compliance/audit",
    "/predictive",
    "/onboarding",
    "/sales/leads",
    "/automation/connectors",
  ]) {
    assert.match(searchSource, new RegExp(`href:\\s*"${href.replace(/\//g, "\\/")}"`));
  }

  assert.match(searchSource, /Ask Auroranexis/);
  assert.match(navSource, /href:\s*"\/copilot"/);

  const settingHrefs = [...settingsDest.matchAll(/href:\s*"(\/settings\/[^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.ok(settingHrefs.length >= 12, "expected settings destinations");
  for (const href of settingHrefs) {
    assert.match(
      settingsDest,
      new RegExp(`href:\\s*"${href.replace(/\//g, "\\/")}"`),
      `settings destinations missing ${href}`,
    );
  }

  const primaryBlock = navSource.slice(
    navSource.indexOf("export const PRIMARY_NAV"),
    navSource.indexOf("function passesRoleFilter"),
  );
  const primaryHrefs = [...primaryBlock.matchAll(/href:\s*"(\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(primaryHrefs.length >= 10, "PRIMARY_NAV should expose core destinations");
  assert.match(searchSource, /return PRIMARY_NAV\.map/);

  console.log(
    `PASS search derives ${primaryHrefs.length} PRIMARY_NAV + ${settingHrefs.length} settings hubs`,
  );
}

section("Hotspot selects use nativeSelectControl");
{
  const hotspots = [
    "src/components/compliance/compliance-workspace.tsx",
    "src/components/monitoring/connector-actions.tsx",
    "src/components/monitoring/connector-form.tsx",
    "src/components/team/team-member-actions.tsx",
    "src/components/sales/sales-lead-form.tsx",
  ];
  for (const file of hotspots) {
    const src = readSource(file);
    assert.match(src, /nativeSelectControl/, `${file} should use nativeSelectControl`);
  }
  console.log("PASS hotspot selects use nativeSelectControl");
}

console.log("\nAll global UI system remediation checks passed.");
