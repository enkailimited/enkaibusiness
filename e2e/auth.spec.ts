import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect to login when accessing protected route", async ({ page }) => {
    await page.goto("/platform/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show validation errors on empty form", async ({ page }) => {
    await page.goto("/login");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator(".text-red-500, .text-destructive, [role=alert]").first()).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/login");
    await page.locator('a[href*="register"]').click();
    await expect(page).toHaveURL(/\/register/);
  });
});
