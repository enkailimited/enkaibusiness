import "server-only";

import { prisma } from "@/server/db";

export interface BusinessTypeRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  modes: { slug: string; name: string }[];
  modules: { module: string; isRequired: boolean }[];
  catalogTypes: { slug: string; name: string }[];
}

export class BusinessTypeService {
  async findById(id: string): Promise<BusinessTypeRecord | null> {
    const bt = await prisma.businessType.findUnique({
      where: { id },
      include: {
        modes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        modules: { where: { isActive: true } },
        catalogTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!bt) return null;
    return this.toRecord(bt);
  }

  async findBySlug(slug: string): Promise<BusinessTypeRecord | null> {
    const bt = await prisma.businessType.findUnique({
      where: { slug },
      include: {
        modes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        modules: { where: { isActive: true } },
        catalogTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!bt) return null;
    return this.toRecord(bt);
  }

  async findAllActive(): Promise<BusinessTypeRecord[]> {
    const types = await prisma.businessType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        modes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        modules: { where: { isActive: true } },
        catalogTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    return types.map((bt) => this.toRecord(bt));
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await prisma.businessType.count({ where: { slug } });
    return count > 0;
  }

  private toRecord(bt: any): BusinessTypeRecord {
    return {
      id: bt.id,
      name: bt.name,
      slug: bt.slug,
      description: bt.description,
      isActive: bt.isActive,
      modes: bt.modes?.map((m: any) => ({ slug: m.slug, name: m.name })) ?? [],
      modules: bt.modules?.map((m: any) => ({ module: m.module, isRequired: m.isRequired })) ?? [],
      catalogTypes: bt.catalogTypes?.map((c: any) => ({ slug: c.slug, name: c.name })) ?? [],
    };
  }
}

export const businessTypeService = new BusinessTypeService();
