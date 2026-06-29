import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";

export interface SearchDocument {
  id: string;
  [key: string]: unknown;
}

export interface SearchResults<T extends SearchDocument> {
  items: T[];
  total: number;
}

export interface SearchQuery {
  q: string;
  fields: string[];
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  skip?: number;
  take?: number;
  model: string;
}

export interface SearchAdapter {
  search<T extends SearchDocument>(query: SearchQuery): Promise<SearchResults<T>>;
}

export class PrismaSearchAdapter implements SearchAdapter {
  private prisma: PrismaClient;

  constructor(client?: PrismaClient) {
    this.prisma = client ?? prisma;
  }

  async search<T extends SearchDocument>(query: SearchQuery): Promise<SearchResults<T>> {
    const { q, fields, where, include, orderBy, skip, take, model } = query;

    const prismaModel = (this.prisma as unknown as Record<string, unknown>)[model] as {
      findMany: (args: Record<string, unknown>) => Promise<T[]>;
      count: (args: Record<string, unknown>) => Promise<number>;
    };

    if (!q || !q.trim()) {
      const [items, total] = await Promise.all([
        prismaModel.findMany({
          ...(where ? { where } : {}),
          ...(include ? { include } : {}),
          ...(orderBy ? { orderBy } : {}),
          ...(skip !== undefined ? { skip } : {}),
          ...(take !== undefined ? { take } : {}),
        } as Record<string, unknown>),
        prismaModel.count({ ...(where ? { where } : {}) } as Record<string, unknown>),
      ]);
      return { items, total };
    }

    const orConditions = fields.map((field) => {
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        return { [parent]: { [child]: { contains: q, mode: "insensitive" } } };
      }
      return { [field]: { contains: q, mode: "insensitive" } };
    });

    const searchWhere = { ...(where || {}), OR: orConditions };

    const [items, total] = await Promise.all([
      prismaModel.findMany({
        where: searchWhere,
        ...(include ? { include } : {}),
        ...(orderBy ? { orderBy } : {}),
        ...(skip !== undefined ? { skip } : {}),
        ...(take !== undefined ? { take } : {}),
      } as Record<string, unknown>),
      prismaModel.count({ where: searchWhere } as Record<string, unknown>),
    ]);

    return { items, total };
  }
}
