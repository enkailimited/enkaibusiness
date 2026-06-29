import "server-only";

import { prisma } from "@/server/db";

const STANDARD_CONVERSIONS: Record<string, Record<string, number>> = {
  piece: { pack: 1, dozen: 12, box: 12, carton: 24, bag: 100, pallet: 1000 },
  pack: { piece: 1, dozen: 12, box: 12, carton: 24 },
  dozen: { piece: 12, pack: 12, box: 1, carton: 2 },
  box: { piece: 12, pack: 12, dozen: 1, carton: 2 },
  carton: { piece: 24, pack: 24, dozen: 2, box: 2 },
  bag: { piece: 100, kg: 50 },
  kg: { g: 1000, ton: 0.001, bag: 0.02 },
  g: { kg: 0.001 },
  l: { ml: 1000 },
  ml: { l: 0.001 },
  ton: { kg: 1000, bag: 20 },
  roll: { piece: 1 },
  bundle: { piece: 10, pack: 10 },
  pallet: { piece: 1000, carton: 42, bag: 20 },
};

export class UoMEngine {
  async convert(params: {
    businessId: string;
    fromUnitId: string;
    toUnitId: string;
    quantity: number;
  }): Promise<{ convertedQuantity: number; factor: number }> {
    const conversion = await prisma.unitConversion.findUnique({
      where: { fromUnitId_toUnitId: { fromUnitId: params.fromUnitId, toUnitId: params.toUnitId } },
    });

    if (conversion) {
      const factor = Number(conversion.factor);
      return { convertedQuantity: params.quantity * factor, factor };
    }

    const reverse = await prisma.unitConversion.findUnique({
      where: { fromUnitId_toUnitId: { fromUnitId: params.toUnitId, toUnitId: params.fromUnitId } },
    });

    if (reverse) {
      const factor = 1 / Number(reverse.factor);
      return { convertedQuantity: params.quantity * factor, factor };
    }

    const fallback = await this.resolveChainConversion(params.fromUnitId, params.toUnitId, params.quantity);
    if (fallback) return fallback;

    throw new Error(`No conversion found between units ${params.fromUnitId} and ${params.toUnitId}`);
  }

  private async resolveChainConversion(
    fromUnitId: string,
    toUnitId: string,
    quantity: number,
  ): Promise<{ convertedQuantity: number; factor: number } | null> {
    const [fromUnit, toUnit] = await Promise.all([
      prisma.unit.findUnique({ where: { id: fromUnitId } }),
      prisma.unit.findUnique({ where: { id: toUnitId } }),
    ]);
    if (!fromUnit || !toUnit) return null;

    const templateFrom = fromUnit.name.toLowerCase();
    const templateTo = toUnit.name.toLowerCase();

    if (STANDARD_CONVERSIONS[templateFrom]?.[templateTo] !== undefined) {
      const factor = STANDARD_CONVERSIONS[templateFrom][templateTo];
      return { convertedQuantity: quantity * factor, factor };
    }

    if (STANDARD_CONVERSIONS[templateTo]?.[templateFrom] !== undefined) {
      const factor = 1 / STANDARD_CONVERSIONS[templateTo][templateFrom];
      return { convertedQuantity: quantity * factor, factor };
    }

    if (fromUnit.type === toUnit.type) {
      const baseUnits = Object.entries(STANDARD_CONVERSIONS)
        .filter(([_, vals]) => vals[templateFrom] !== undefined || vals[templateTo] !== undefined);

      for (const [baseName, _] of baseUnits) {
        if (STANDARD_CONVERSIONS[baseName]?.[templateFrom] !== undefined &&
            STANDARD_CONVERSIONS[baseName]?.[templateTo] !== undefined) {
          const toBase = 1 / STANDARD_CONVERSIONS[baseName][templateFrom];
          const fromBase = STANDARD_CONVERSIONS[baseName][templateTo];
          const factor = toBase * fromBase;
          return { convertedQuantity: quantity * factor, factor };
        }
      }
    }

    return null;
  }

  async convertToBase(params: {
    businessId: string;
    unitId: string;
    quantity: number;
  }): Promise<{ baseQuantity: number; baseUnitId: string | null }> {
    const unit = await prisma.unit.findUnique({ where: { id: params.unitId } });
    if (!unit) return { baseQuantity: params.quantity, baseUnitId: null };

    if (unit.isBase) return { baseQuantity: params.quantity, baseUnitId: unit.id };

    const baseUnit = await prisma.unit.findFirst({
      where: { businessId: params.businessId, type: unit.type, isBase: true },
    });

    if (!baseUnit) return { baseQuantity: params.quantity, baseUnitId: null };

    const result = await this.convert({
      businessId: params.businessId,
      fromUnitId: params.unitId,
      toUnitId: baseUnit.id,
      quantity: params.quantity,
    });

    return { baseQuantity: result.convertedQuantity, baseUnitId: baseUnit.id };
  }

  async getItemDefaultUnit(catalogItemId: string): Promise<{ unitId: string; unitName: string }> {
    const item = await prisma.catalogItem.findUnique({
      where: { id: catalogItemId },
      select: { unit: { select: { id: true, name: true } } },
    });
    return { unitId: item?.unit?.id ?? "", unitName: item?.unit?.name ?? "piece" };
  }

  async getAvailableConversions(unitId: string) {
    const [direct, reverse] = await Promise.all([
      prisma.unitConversion.findMany({
        where: { fromUnitId: unitId },
        include: { toUnit: { select: { id: true, name: true, abbreviation: true } } },
      }),
      prisma.unitConversion.findMany({
        where: { toUnitId: unitId },
        include: { fromUnit: { select: { id: true, name: true, abbreviation: true } } },
      }),
    ]);

    return [
      ...direct.map((c) => ({
        toUnitId: c.toUnitId,
        toUnitName: c.toUnit.name,
        toUnitAbbreviation: c.toUnit.abbreviation,
        factor: Number(c.factor),
      })),
      ...reverse.map((c) => ({
        toUnitId: c.fromUnitId,
        toUnitName: c.fromUnit.name,
        toUnitAbbreviation: c.fromUnit.abbreviation,
        factor: 1 / Number(c.factor),
      })),
    ];
  }

  getStandardConversionsForUnit(unitName: string): Array<{ to: string; factor: number }> {
    const name = unitName.toLowerCase();
    const conversions = STANDARD_CONVERSIONS[name];
    if (!conversions) return [];
    return Object.entries(conversions).map(([to, factor]) => ({ to, factor }));
  }
}

export const uomEngine = new UoMEngine();
