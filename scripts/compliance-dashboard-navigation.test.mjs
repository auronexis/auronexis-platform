/**
 * Compliance sidebar discoverability — source contracts for nav registry, RBAC parity, search.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("A: PRIMARY_NAV exposes Compliance at the canonical landing route", () => {
  const nav = readSource("src/lib/tenancy/context.ts");
  const primaryBlock = nav.slice(
    nav.indexOf("export const PRIMARY_NAV"),
    nav.indexOf("function passesRoleFilter"),
  );
  assert.match(primaryBlock, /label:\s*"Compliance"/);
  assert.match(primaryBlock, /href:\s*"\/dashboard\/compliance"/);
  assert.doesNotMatch(primaryBlock, /einvoice-archive/);
});

test("B: Administration section lists Compliance with Team, Pricing, Sales, Settings", () => {
  const sections = readSource("src/lib/layout/sidebar-sections.ts");
  assert.match(
    sections,
    /id:\s*"administration"[\s\S]*itemLabels:\s*\["Team", "Pricing", "Sales", "Compliance", "Settings"\]/,
  );
});

test("C: Sidebar uses ShieldCheck for Compliance from lucide-react", () => {
  const sidebar = readSource("src/components/layout/sidebar-nav.tsx");
  assert.match(sidebar, /ShieldCheck/);
  assert.match(sidebar, /Compliance:\s*ShieldCheck/);
  assert.match(sidebar, /from "lucide-react"/);
});

test("D: Nav visibility matches existing Compliance route authorization (owner/admin, settings.write)", () => {
  const nav = readSource("src/lib/tenancy/context.ts");
  const page = readSource("src/app/(dashboard)/dashboard/compliance/page.tsx");
  const guards = readSource("src/lib/team/guards.ts");
  const archiveAuth = readSource("src/lib/einvoice-archive/authorization.ts");
  const primaryBlock = nav.slice(
    nav.indexOf("export const PRIMARY_NAV"),
    nav.indexOf("function passesRoleFilter"),
  );

  assert.match(page, /canManageOrganizationSettings/);
  assert.match(guards, /settings\.write/);
  assert.match(archiveAuth, /canManageOrganizationSettings/);
  assert.match(primaryBlock, /roles:\s*\["owner", "admin"\]/);
  assert.match(nav, /if \(item\.roles && !item\.roles\.includes\(role\)\)/);
  assert.doesNotMatch(nav, /settings\.manage_compliance|compliance\.read|compliance\.write/);
});

test("E: Active state uses longest prefix so Compliance stays active on archive descendants", () => {
  const sidebar = readSource("src/components/layout/sidebar-nav.tsx");
  assert.match(sidebar, /function longestMatchingNavHref/);
  assert.match(sidebar, /pathname\.startsWith\(`\$\{href\}\/`\)/);
  assert.match(sidebar, /href\.length > best\.length/);
  assert.match(sidebar, /const isActive = item\.href === activeHref/);
});

test("F: Mobile and desktop share SidebarNav + PRIMARY_NAV (no parallel registry)", () => {
  const sidebar = readSource("src/components/layout/dashboard-sidebar.tsx");
  const layout = readSource("src/app/(dashboard)/layout.tsx");
  assert.match(sidebar, /<SidebarNav items=\{navItems\} collapsed=\{sidebarCollapsed\} onNavigate=\{close\} \/>/);
  assert.match(layout, /getNavItemsForRoleAndPlan/);
  assert.doesNotMatch(sidebar, /MOBILE_NAV|mobileNavItems/);
});

test("G: Global search still lists Compliance landing, audit explorer, and E-Invoice Archive", () => {
  const search = readSource("src/lib/layout/workspace-search.ts");
  assert.match(search, /href:\s*"\/dashboard\/compliance"/);
  assert.match(search, /href:\s*"\/dashboard\/compliance\/audit"/);
  assert.match(search, /href:\s*"\/dashboard\/compliance\/einvoice-archive"/);
  assert.match(search, /label:\s*"E-Invoice Archive"/);
  assert.match(search, /roles: item\.roles/);
});

test("H: Canonical Compliance page is not duplicated and archive still links back", () => {
  const landing = readSource("src/app/(dashboard)/dashboard/compliance/page.tsx");
  const archive = readSource("src/app/(dashboard)/dashboard/compliance/einvoice-archive/page.tsx");
  assert.match(landing, /title:\s*"Compliance"/);
  assert.match(landing, /href="\/dashboard\/compliance\/einvoice-archive"/);
  assert.match(archive, /Back to compliance/);
  assert.match(archive, /href="\/dashboard\/compliance"/);
});
