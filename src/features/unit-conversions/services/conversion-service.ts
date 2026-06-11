import "server-only";

import { prisma } from "@/server/db";

export interface ConversionResult {
  fromUnit: string;
  toUnit: string;
  fromValue: number;
  toValue: number;
  factor: number;
}

export async function convert(
  _businessId: string,
  fromUnitId: string,
  toUnitId: string,
  value: number,
): Promise<ConversionResult | null> {
  if (fromUnitId === toUnitId) {
    const unit = await prisma.unit.findUnique({ where: { id: fromUnitId } });
    return {
      fromUnit: unit?.name || "unknown",
      toUnit: unit?.name || "unknown",
      fromValue: value,
      toValue: value,
      factor: 1,
    };
  }

  const conversion = await prisma.unitConversion.findUnique({
    where: { fromUnitId_toUnitId: { fromUnitId, toUnitId } },
    include: { fromUnit: true, toUnit: true },
  });

  if (conversion) {
    return {
      fromUnit: conversion.fromUnit.name,
      toUnit: conversion.toUnit.name,
      fromValue: value,
      toValue: value * Number(conversion.factor),
      factor: Number(conversion.factor),
    };
  }

  const reverseConversion = await prisma.unitConversion.findUnique({
    where: { fromUnitId_toUnitId: { fromUnitId: toUnitId, toUnitId: fromUnitId } },
    include: { fromUnit: true, toUnit: true },
  });

  if (reverseConversion) {
    const factor = 1 / Number(reverseConversion.factor);
    return {
      fromUnit: reverseConversion.toUnit.name,
      toUnit: reverseConversion.fromUnit.name,
      fromValue: value,
      toValue: value * factor,
      factor,
    };
  }

  return null;
}

export async function createConversion(
  _businessId: string,
  fromUnitId: string,
  toUnitId: string,
  factor: number,
) {
  const fromUnit = await prisma.unit.findFirstOrThrow({
    where: { id: fromUnitId, businessId: _businessId },
  });
  const toUnit = await prisma.unit.findFirstOrThrow({
    where: { id: toUnitId, businessId: _businessId },
  });

  if (!fromUnit || !toUnit) {
    throw new Error("Units not found in this business");
  }

  if (fromUnit.type !== toUnit.type) {
    throw new Error("Cannot convert between different unit types");
  }

  return prisma.unitConversion.create({
    data: { fromUnitId, toUnitId, factor },
  });
}

export async function deleteConversion(id: string) {
  return prisma.unitConversion.delete({ where: { id } });
}

export async function getConversions(businessId: string) {
  const units = await prisma.unit.findMany({
    where: { businessId },
    include: {
      fromConversions: {
        include: { toUnit: true },
      },
      toConversions: {
        include: { fromUnit: true },
      },
    },
  });

  return units.map((unit) => ({
    unit: { id: unit.id, name: unit.name, abbreviation: unit.abbreviation, type: unit.type },
    fromConversions: unit.fromConversions.map((c) => ({
      id: c.id,
      toUnit: { id: c.toUnit.id, name: c.toUnit.name, abbreviation: c.toUnit.abbreviation },
      factor: Number(c.factor),
    })),
    toConversions: unit.toConversions.map((c) => ({
      id: c.id,
      fromUnit: { id: c.fromUnit.id, name: c.fromUnit.name, abbreviation: c.fromUnit.abbreviation },
      factor: 1 / Number(c.factor),
    })),
  }));
}

export async function convertForSale(
  businessId: string,
  itemId: string,
  fromUnitId: string,
  toUnitId: string,
  quantity: number,
): Promise<{ quantity: number; unitPrice: number } | null> {
  const conversion = await convert(businessId, fromUnitId, toUnitId, quantity);
  if (!conversion) return null;

  const item = await prisma.catalogItem.findUnique({ where: { id: itemId } });
  if (!item) return null;

  const unitPrice = (Number(item.price) / conversion.factor);

  return {
    quantity: conversion.toValue,
    unitPrice,
  };
}
