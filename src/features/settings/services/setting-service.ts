import "server-only";

import { prisma } from "@/server/db";
import type { ActionResponse } from "@/types/relationships";
import type { SettingValue, SettingType, SettingWithParsedValue } from "../types";

export function parseSettingValue(value: string, type: SettingType): SettingValue {
  switch (type) {
    case "number":
      return Number(value);
    case "boolean":
      return value === "true";
    case "json":
      return JSON.parse(value);
    default:
      return value;
  }
}

export function serializeSettingValue(value: SettingValue): string {
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function getSettingType(value: SettingValue): SettingType {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "object") return "json";
  return "string";
}

export async function getSetting(
  key: string,
  scope: { businessId?: string; userId?: string },
): Promise<SettingWithParsedValue | null> {
  const where: Record<string, unknown> = { key };
  if (scope.businessId) where.businessId = scope.businessId;
  if (scope.userId) where.userId = scope.userId;

  const setting = await prisma.setting.findFirst({ where });
  if (!setting) return null;

  return {
    ...setting,
    value: parseSettingValue(setting.value, setting.type as SettingType),
  } as SettingWithParsedValue;
}

export async function setSetting(
  key: string,
  value: SettingValue,
  options?: {
    businessId?: string;
    userId?: string;
    description?: string;
    isPublic?: boolean;
  },
): Promise<ActionResponse & { data?: SettingWithParsedValue }> {
  try {
    const type = getSettingType(value);
    const serialized = serializeSettingValue(value);

    const where: Record<string, unknown> = { key };
    if (options?.businessId) where.businessId = options.businessId;
    if (options?.userId) where.userId = options.userId;

    const existing = await prisma.setting.findFirst({ where });

    let setting;
    if (existing) {
      setting = await prisma.setting.update({
        where: { id: existing.id },
        data: {
          value: serialized,
          type,
          description: options?.description,
          isPublic: options?.isPublic,
        },
      });
    } else {
      setting = await prisma.setting.create({
        data: {
          businessId: options?.businessId ?? null,
          userId: options?.userId ?? null,
          key,
          value: serialized,
          type,
          description: options?.description,
          isPublic: options?.isPublic ?? false,
        },
      });
    }

    return {
      success: true,
      message: "Setting saved",
      data: {
        ...setting,
        value: parseSettingValue(setting.value, setting.type as SettingType),
      } as SettingWithParsedValue,
    };
  } catch (error) {
    console.error("Set setting error:", error);
    return { success: false, message: "Failed to save setting" };
  }
}

export async function getBusinessSettings(
  businessId: string,
): Promise<SettingWithParsedValue[]> {
  const settings = await prisma.setting.findMany({
    where: { businessId },
  });

  return settings.map((s) => ({
    ...s,
    value: parseSettingValue(s.value, s.type as SettingType),
  })) as SettingWithParsedValue[];
}

export async function getUserSettings(
  userId: string,
): Promise<SettingWithParsedValue[]> {
  const settings = await prisma.setting.findMany({
    where: { userId },
  });

  return settings.map((s) => ({
    ...s,
    value: parseSettingValue(s.value, s.type as SettingType),
  })) as SettingWithParsedValue[];
}

export async function deleteSetting(id: string): Promise<ActionResponse> {
  try {
    await prisma.setting.delete({ where: { id } });
    return { success: true, message: "Setting deleted" };
  } catch (error) {
    console.error("Delete setting error:", error);
    return { success: false, message: "Failed to delete setting" };
  }
}

export async function getSettingsByCategory(
  businessId: string | undefined,
  userId: string | undefined,
  category?: string,
): Promise<SettingWithParsedValue[]> {
  const where: Record<string, unknown> = {};
  if (businessId) where.businessId = businessId;
  if (userId) where.userId = userId;
  if (category) where.key = { startsWith: `${category}.` };

  const settings = await prisma.setting.findMany({ where });

  return settings.map((s) => ({
    ...s,
    value: parseSettingValue(s.value, s.type as SettingType),
  })) as SettingWithParsedValue[];
}
