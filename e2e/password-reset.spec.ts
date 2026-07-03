import { expect, test } from "@playwright/test";

test.describe("Password reset", () => {
  test("login page shows forgot password link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  test("forgot password page renders form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset instructions" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to login" })).toHaveAttribute("href", "/login");
  });

  test("forgot password rejects invalid email format", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByRole("button", { name: "Send reset instructions" }).click();
    await expect(page.getByText("Invalid email address.")).toBeVisible();
  });

  test("reset password page shows session error without token", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("Your reset session has expired. Request a new reset link.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  test("reset password page rejects invalid recovery code", async ({ page }) => {
    await page.goto("/reset-password?code=invalid-recovery-code");
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
  });

  test("login shows success message after reset redirect param", async ({ page }) => {
    await page.goto("/login?reset=success");
    await expect(page.getByText("Password updated successfully.")).toBeVisible();
  });
});
