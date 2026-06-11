import { describe, it, expect } from "vitest";

// Pure logic tests for pricing priority
const TIER_PRIORITY = ["customer_group", "promo", "wholesale", "retail"] as const;
type PricingTier = (typeof TIER_PRIORITY)[number];

function resolvePrice(
  tiers: Array<{ tier: PricingTier; price: number }>,
  customerGroup?: string,
  quantity?: number,
): { price: number; tier: PricingTier } | null {
  const matched = tiers.filter((t) => {
    if (t.tier === "customer_group" && !customerGroup) return false;
    if (t.tier === "wholesale" && (!quantity || quantity < 5)) return false;
    return true;
  });

  for (const priority of TIER_PRIORITY) {
    const found = matched.find((t) => t.tier === priority);
    if (found) return { price: found.price, tier: found.tier };
  }

  return tiers.find((t) => t.tier === "retail") || null;
}

describe("Pricing Engine Priority", () => {
  const defaultTiers: Array<{ tier: PricingTier; price: number }> = [
    { tier: "retail", price: 100 },
    { tier: "wholesale", price: 80 },
    { tier: "promo", price: 70 },
    { tier: "customer_group", price: 60 },
  ];

  it("should prefer customer_group over all others", () => {
    const result = resolvePrice(defaultTiers, "vip-group");
    expect(result?.tier).toBe("customer_group");
    expect(result?.price).toBe(60);
  });

  it("should prefer promo over wholesale and retail", () => {
    const result = resolvePrice(
      defaultTiers.filter((t) => t.tier !== "customer_group"),
      undefined,
      10,
    );
    expect(result?.tier).toBe("promo");
    expect(result?.price).toBe(70);
  });

  it("should prefer wholesale over retail for large quantities", () => {
    const result = resolvePrice(
      defaultTiers.filter((t) => t.tier !== "customer_group" && t.tier !== "promo"),
      undefined,
      10,
    );
    expect(result?.tier).toBe("wholesale");
    expect(result?.price).toBe(80);
  });

  it("should fall back to retail", () => {
    const result = resolvePrice([{ tier: "retail", price: 100 }]);
    expect(result?.tier).toBe("retail");
    expect(result?.price).toBe(100);
  });

  it("should not apply wholesale for small quantities", () => {
    const result = resolvePrice(
      defaultTiers.filter((t) => t.tier !== "customer_group" && t.tier !== "promo"),
      undefined,
      1,
    );
    expect(result?.tier).toBe("retail");
    expect(result?.price).toBe(100);
  });
});
