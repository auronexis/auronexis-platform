import { test, expect } from "@playwright/test";
import { hasE2ECredentials } from "./helpers/auth";
import { expectModuleOrUpgradeGate, gotoAppRoute } from "./helpers/module-gate";

/**
 * Staging validation flows — require E2E_TEST_EMAIL / E2E_TEST_PASSWORD.
 * Manual flows (Stripe checkout, OAuth callback) documented in docs/staging-checklist.md.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
  test.skip(
    !hasE2ECredentials(),
    "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD for staging validation.",
  );
});

test.describe("Staging module smoke", () => {
  test("clients list and create form", async ({ page }) => {
    await gotoAppRoute(page, "/clients");
    await expect(page.getByRole("heading", { level: 1, name: "Clients" })).toBeVisible();
    await page.goto("/clients/new");
    await expect(page.getByLabel("Client name")).toBeVisible();
  });

  test("reports list and new report", async ({ page }) => {
    await gotoAppRoute(page, "/reports");
    await expect(page.getByRole("heading", { level: 1, name: "Reports" })).toBeVisible();
    await page.goto("/reports/new");
    await expect(page.getByLabel("Report title")).toBeVisible();
  });

  test("risks and incidents modules", async ({ page }) => {
    await gotoAppRoute(page, "/risks");
    await expectModuleOrUpgradeGate(page, { moduleHeading: "Risk Center" });
    await gotoAppRoute(page, "/incidents");
    await expectModuleOrUpgradeGate(page, { moduleHeading: "Incident Center" });
  });

  test("automation hub", async ({ page }) => {
    await gotoAppRoute(page, "/automation");
    await expectModuleOrUpgradeGate(page, { moduleHeading: "Automation" });
  });

  test("billing and usage settings", async ({ page }) => {
    await gotoAppRoute(page, "/settings/billing");
    await expect(
      page.getByRole("heading", { level: 1, name: /subscription & billing/i }),
    ).toBeVisible();
    await gotoAppRoute(page, "/settings/usage");
    await expect(page.getByRole("heading", { name: /usage/i })).toBeVisible();
  });

  test("connectors and integrations", async ({ page }) => {
    await gotoAppRoute(page, "/automation/connectors");
    await expectModuleOrUpgradeGate(page, { moduleHeading: "Enterprise Connectors" });
    await gotoAppRoute(page, "/automation/integrations");
    await expectModuleOrUpgradeGate(page, { moduleHeading: /integration/i });
  });

  test("API settings", async ({ page }) => {
    await gotoAppRoute(page, "/settings/api");
    await expect(page.getByRole("heading", { level: 1, name: "Public API" })).toBeVisible();
  });

  test("white label branding", async ({ page }) => {
    await gotoAppRoute(page, "/settings/branding");
    await expectModuleOrUpgradeGate(page, { moduleHeading: "White Label Branding" });
  });

  test("compliance center and audit", async ({ page }) => {
    await gotoAppRoute(page, "/dashboard/compliance");
    await expect(page.getByRole("heading", { level: 1, name: /compliance & governance/i })).toBeVisible();
    await gotoAppRoute(page, "/dashboard/compliance/audit");
    await expect(page.getByRole("heading", { level: 1, name: "Audit Explorer" })).toBeVisible();
  });

  test("predictive intelligence", async ({ page }) => {
    await gotoAppRoute(page, "/dashboard/predictive");
    await expectModuleOrUpgradeGate(page, { moduleHeading: /predictive intelligence/i });
  });

  test("diagnostics infrastructure sections", async ({ page }) => {
    await gotoAppRoute(page, "/settings/diagnostics");
    await expect(page.getByRole("heading", { level: 1, name: "Diagnostics" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cron infrastructure" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Queue infrastructure" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Production readiness" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Deployment readiness" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pilot execution readiness" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Go-live readiness" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Revenue readiness" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Acquisition readiness", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "First customer readiness", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Launch candidate readiness", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security readiness" })).toBeVisible();
  });

  test("sales pipeline dashboard", async ({ page }) => {
    await gotoAppRoute(page, "/sales");
    await expect(page.getByRole("heading", { level: 1, name: "Sales pipeline" })).toBeVisible();
    await expect(page.getByText("Contact inbox")).toBeVisible();
  });

  test("acquisition dashboard and outbound workspace", async ({ page }) => {
    await gotoAppRoute(page, "/sales/acquisition");
    await expect(page.getByRole("heading", { level: 1, name: "Acquisition dashboard" })).toBeVisible();
    await expect(page.getByText("New leads (30d)")).toBeVisible();
    await gotoAppRoute(page, "/sales/outbound");
    await expect(page.getByRole("heading", { level: 1, name: "Outbound workspace" })).toBeVisible();
    await gotoAppRoute(page, "/sales/templates");
    await expect(page.getByRole("heading", { level: 1, name: "Outreach templates" })).toBeVisible();
  });

  test("sales execution sourcing and proposals", async ({ page }) => {
    await gotoAppRoute(page, "/sales/execution");
    await expect(page.getByRole("heading", { level: 1, name: "Sales execution" })).toBeVisible();
    await expect(page.getByText("Outreach sent")).toBeVisible();
    await gotoAppRoute(page, "/sales/sourcing");
    await expect(page.getByRole("heading", { level: 1, name: "Lead sourcing" })).toBeVisible();
    await gotoAppRoute(page, "/sales/proposals");
    await expect(page.getByRole("heading", { level: 1, name: "Proposal generator" })).toBeVisible();
    await gotoAppRoute(page, "/sales/onboarding");
    await expect(page.getByRole("heading", { level: 1, name: "Customer onboarding" })).toBeVisible();
  });

  test("portal login page", async ({ page }) => {
    await page.goto("/client-portal/login");
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
