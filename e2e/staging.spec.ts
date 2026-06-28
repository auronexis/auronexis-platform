import { test, expect } from "@playwright/test";
import { hasE2ECredentials } from "./helpers/auth";

/**
 * Staging validation flows — require E2E_EMAIL / E2E_PASSWORD.
 * Manual flows (Stripe checkout, OAuth callback) documented in docs/staging-checklist.md.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
  test.skip(!hasE2ECredentials(), "Set E2E_EMAIL and E2E_PASSWORD for staging validation.");
});

test.describe("Staging module smoke", () => {
  test("clients list and create form", async ({ page }) => {
    await page.goto("/clients");
    await expect(page.getByRole("heading", { level: 1, name: "Clients" })).toBeVisible();
    await page.goto("/clients/new");
    await expect(page.getByLabel("Client name")).toBeVisible();
  });

  test("reports list and new report", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("heading", { level: 1, name: "Reports" })).toBeVisible();
    await page.goto("/reports/new");
    await expect(page.getByLabel("Report title")).toBeVisible();
  });

  test("risks and incidents modules", async ({ page }) => {
    await page.goto("/risks");
    await expect(page.getByRole("heading", { level: 1, name: "Risk Center" })).toBeVisible();
    await page.goto("/incidents");
    await expect(page.getByRole("heading", { level: 1, name: "Incident Center" })).toBeVisible();
  });

  test("automation hub", async ({ page }) => {
    await page.goto("/automation");
    await expect(page.getByRole("heading", { level: 1, name: "Automation" })).toBeVisible();
  });

  test("billing and usage settings", async ({ page }) => {
    await page.goto("/settings/billing");
    await expect(
      page.getByRole("heading", { level: 1, name: /subscription & billing/i }),
    ).toBeVisible();
    await page.goto("/settings/usage");
    await expect(page.getByRole("heading", { name: /usage/i })).toBeVisible();
  });

  test("connectors and integrations", async ({ page }) => {
    await page.goto("/automation/connectors");
    await expect(page.getByRole("heading", { level: 1, name: "Enterprise Connectors" })).toBeVisible();
    await page.goto("/automation/integrations");
    await expect(page.getByRole("heading", { level: 1, name: /integration/i })).toBeVisible();
  });

  test("API settings", async ({ page }) => {
    await page.goto("/settings/api");
    await expect(page.getByRole("heading", { level: 1, name: "Public API" })).toBeVisible();
  });

  test("white label branding", async ({ page }) => {
    await page.goto("/settings/branding");
    await expect(page.getByRole("heading", { level: 1, name: "White Label Branding" })).toBeVisible();
  });

  test("compliance center and audit", async ({ page }) => {
    await page.goto("/dashboard/compliance");
    await expect(page.getByRole("heading", { level: 1, name: /compliance & governance/i })).toBeVisible();
    await page.goto("/dashboard/compliance/audit");
    await expect(page.getByRole("heading", { level: 1, name: "Audit Explorer" })).toBeVisible();
  });

  test("predictive intelligence", async ({ page }) => {
    await page.goto("/dashboard/predictive");
    await expect(page.getByRole("heading", { level: 1, name: /predictive intelligence/i })).toBeVisible();
  });

  test("diagnostics infrastructure sections", async ({ page }) => {
    await page.goto("/settings/diagnostics");
    await expect(page.getByRole("heading", { level: 1, name: "Diagnostics" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Stripe webhooks" })).toBeVisible({
      timeout: 30_000,
    });
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
    await page.goto("/sales");
    await expect(page.getByRole("heading", { level: 1, name: "Sales pipeline" })).toBeVisible();
    await expect(page.getByText("Contact inbox")).toBeVisible();
  });

  test("acquisition dashboard and outbound workspace", async ({ page }) => {
    await page.goto("/sales/acquisition");
    await expect(page.getByRole("heading", { level: 1, name: "Acquisition dashboard" })).toBeVisible();
    await expect(page.getByText("New leads (30d)")).toBeVisible();
    await page.goto("/sales/outbound");
    await expect(page.getByRole("heading", { level: 1, name: "Outbound workspace" })).toBeVisible();
    await page.goto("/sales/templates");
    await expect(page.getByRole("heading", { level: 1, name: "Outreach templates" })).toBeVisible();
  });

  test("sales execution sourcing and proposals", async ({ page }) => {
    await page.goto("/sales/execution");
    await expect(page.getByRole("heading", { level: 1, name: "Sales execution" })).toBeVisible();
    await expect(page.getByText("Outreach sent")).toBeVisible();
    await page.goto("/sales/sourcing");
    await expect(page.getByRole("heading", { level: 1, name: "Lead sourcing" })).toBeVisible();
    await page.goto("/sales/proposals");
    await expect(page.getByRole("heading", { level: 1, name: "Proposal generator" })).toBeVisible();
    await page.goto("/sales/onboarding");
    await expect(page.getByRole("heading", { level: 1, name: "Customer onboarding" })).toBeVisible();
  });

  test("portal login page", async ({ page }) => {
    await page.goto("/client-portal/login");
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
