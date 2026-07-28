import { test, expect } from "@playwright/test";

test.describe("Health Check", () => {
  test("should return healthy status from health API", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(["healthy", "degraded"]).toContain(body.status);
    expect(body.checks).toHaveProperty("database");
    expect(body.checks.database.status).toBe("pass");
    expect(body).toHaveProperty("timestamp");
  });

  test("should return auth health", async ({ request }) => {
    const response = await request.get("/api/auth/health");
    expect(response.ok()).toBeTruthy();
  });
});
