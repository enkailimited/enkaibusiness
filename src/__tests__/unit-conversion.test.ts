import { describe, it, expect } from "vitest";

function convertValue(value: number, fromUnit: string, toUnit: string, conversions: Record<string, Record<string, number>>): number | null {
  if (fromUnit === toUnit) return value;
  if (conversions[fromUnit]?.[toUnit]) {
    return value * conversions[fromUnit][toUnit];
  }
  if (conversions[toUnit]?.[fromUnit]) {
    return value / conversions[toUnit][fromUnit];
  }
  return null;
}

describe("Unit Conversion Logic", () => {
  const conversions: Record<string, Record<string, number>> = {
    kg: { g: 1000 },
    g: { kg: 0.001 },
    carton: { pcs: 24 },
    box: { pcs: 12 },
  };

  it("should convert kg to g", () => {
    expect(convertValue(1, "kg", "g", conversions)).toBe(1000);
  });

  it("should convert g to kg", () => {
    expect(convertValue(1000, "g", "kg", conversions)).toBe(1);
  });

  it("should return same value for same unit", () => {
    expect(convertValue(5, "kg", "kg", conversions)).toBe(5);
  });

  it("should convert carton to pcs", () => {
    expect(convertValue(2, "carton", "pcs", conversions)).toBe(48);
  });

  it("should return null for unknown conversion", () => {
    expect(convertValue(1, "kg", "pcs", conversions)).toBeNull();
  });

  it("should handle reverse conversions", () => {
    const val = convertValue(48, "pcs", "carton", conversions);
    expect(val).toBeCloseTo(2, 10);
  });
});
