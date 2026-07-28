import "server-only";
import crypto from "crypto";
import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";

const KEY_PREFIX = "enk_";

export interface CreateApiKeyInput {
  businessId: string;
  name: string;
  permissions: string[];
  scope?: string;
  expiresInDays?: number;
}

export interface ApiKeyResult {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  scope: string;
  expiresAt: Date | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export class ApiKeyService {
  async create(input: CreateApiKeyInput): Promise<{ key: string; keyData: ApiKeyResult }> {
    const rawKey = KEY_PREFIX + crypto.randomBytes(32).toString("hex");
    const keyPrefix = rawKey.substring(0, 8);
    const keyHash = await bcrypt.hash(rawKey, 10);
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 86400000)
      : null;

    const record = await prisma.apiKey.create({
      data: {
        businessId: input.businessId,
        name: input.name,
        keyPrefix,
        keyHash,
        permissions: input.permissions,
        scope: input.scope || "business",
        expiresAt,
      },
    });

    return {
      key: rawKey,
      keyData: {
        id: record.id,
        name: record.name,
        keyPrefix: record.keyPrefix,
        permissions: record.permissions as string[],
        scope: record.scope,
        expiresAt: record.expiresAt,
        isActive: record.isActive,
        lastUsedAt: record.lastUsedAt,
        createdAt: record.createdAt,
      },
    };
  }

  async validate(key: string): Promise<{ valid: boolean; apiKey?: ApiKeyResult }> {
    const keyPrefix = key.substring(0, 8);
    const records = await prisma.apiKey.findMany({
      where: { keyPrefix, isActive: true },
    });

    for (const record of records) {
      const match = await bcrypt.compare(key, record.keyHash);
      if (match) {
        if (record.expiresAt && record.expiresAt < new Date()) {
          await prisma.apiKey.update({ where: { id: record.id }, data: { isActive: false } });
          return { valid: false };
        }
        await prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
        return {
          valid: true,
          apiKey: {
            id: record.id,
            name: record.name,
            keyPrefix: record.keyPrefix,
            permissions: record.permissions as string[],
            scope: record.scope,
            expiresAt: record.expiresAt,
            isActive: record.isActive,
            lastUsedAt: record.lastUsedAt,
            createdAt: record.createdAt,
          },
        };
      }
    }
    return { valid: false };
  }

  async list(businessId: string): Promise<ApiKeyResult[]> {
    const records = await prisma.apiKey.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      keyPrefix: r.keyPrefix,
      permissions: r.permissions as string[],
      scope: r.scope,
      expiresAt: r.expiresAt,
      isActive: r.isActive,
      lastUsedAt: r.lastUsedAt,
      createdAt: r.createdAt,
    }));
  }

  async revoke(id: string, businessId: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id, businessId },
      data: { isActive: false },
    });
  }

  async hasPermission(apiKey: ApiKeyResult, requiredPermission: string): Promise<boolean> {
    if (apiKey.permissions.includes("*")) return true;
    if (apiKey.permissions.includes(requiredPermission)) return true;
    const parts = requiredPermission.split(".");
    if (parts.length >= 2) {
      const wildcard = parts[0] + ".*";
      if (apiKey.permissions.includes(wildcard)) return true;
    }
    return false;
  }
}

export const apiKeyService = new ApiKeyService();
