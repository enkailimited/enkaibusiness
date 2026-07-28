import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/platform/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show landing page publicly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
