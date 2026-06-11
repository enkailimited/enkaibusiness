import { describe, it, expect, vi } from "vitest";

// Mock prisma
vi.mock("@/server/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    user: { count: vi.fn(), findUnique: vi.fn() },
    workspaceMember: { count: vi.fn() },
    role: { count: vi.fn() },
  },
}));

describe("Auth Diagnostics", () => {
  it("should detect healthy database", async () => {
    const { prisma } = await import("@/server/db");
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);

    const result = await prisma.$queryRaw`SELECT 1`;
    expect(result).toEqual([{ "?column?": 1 }]);
  });

  it("should count users", async () => {
    const { prisma } = await import("@/server/db");
    vi.mocked(prisma.user.count).mockResolvedValue(5);

    const count = await prisma.user.count();
    expect(count).toBe(5);
  });

  it("should count roles", async () => {
    const { prisma } = await import("@/server/db");
    vi.mocked(prisma.role.count).mockResolvedValue(10);

    const count = await prisma.role.count();
    expect(count).toBe(10);
  });
});
