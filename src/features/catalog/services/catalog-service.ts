import "server-only";

import { prisma } from "@/server/db";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types/relationships";
import type { CreateCatalogItemSchema, UpdateCatalogItemSchema } from "../schemas";
import type { CatalogItemWithRelations, CatalogItemFilter } from "../types";
import { DEFAULT_PAGE_SIZE } from "../constants";

export async function createCatalogItem(
  businessId: string,
  userId: string,
  data: CreateCatalogItemSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const slug = slugify(data.name);

    const item = await prisma.catalogItem.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        itemType: data.itemType,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        unitId: data.unitId || null,
        price: data.price,
        costPrice: data.costPrice ?? null,
        taxRate: data.taxRate ?? null,
        currency: data.currency,
        isService: data.isService ?? false,
        trackStock: data.trackStock ?? true,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive ?? true,
        metadata: data.metadata ?? {},
        businessId,
        createdById: userId,
        updatedById: userId,
      },
    });

    return {
      success: true,
      message: "Catalog item created successfully",
      data: { id: item.id },
    };
  } catch (error) {
    console.error("Create catalog item error:", error);
    return { success: false, message: "Failed to create catalog item" };
  }
}

export async function updateCatalogItem(
  id: string,
  userId: string,
  data: UpdateCatalogItemSchema,
): Promise<ActionResponse & { data?: CatalogItemWithRelations }> {
  try {
    const updateData: Record<string, unknown> = {
      ...data,
      slug: data.name ? slugify(data.name) : undefined,
      description: data.description !== undefined ? (data.description || null) : undefined,
      sku: data.sku !== undefined ? (data.sku || null) : undefined,
      barcode: data.barcode !== undefined ? (data.barcode || null) : undefined,
      categoryId: data.categoryId !== undefined ? (data.categoryId || null) : undefined,
      brandId: data.brandId !== undefined ? (data.brandId || null) : undefined,
      unitId: data.unitId !== undefined ? (data.unitId || null) : undefined,
      imageUrl: data.imageUrl !== undefined ? (data.imageUrl || null) : undefined,
      updatedById: userId,
    };

    const item = await prisma.catalogItem.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return {
      success: true,
      message: "Catalog item updated successfully",
      data: item as unknown as CatalogItemWithRelations,
    };
  } catch (error) {
    console.error("Update catalog item error:", error);
    return { success: false, message: "Failed to update catalog item" };
  }
}

export async function getCatalogItem(id: string) {
  return prisma.catalogItem.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      unit: { select: { id: true, name: true, abbreviation: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getBusinessCatalog(
  businessId: string,
  filter?: CatalogItemFilter,
): Promise<{ items: CatalogItemWithRelations[]; total: number; page: number; totalPages: number }> {
  const page = filter?.page ?? 1;
  const limit = filter?.limit ?? DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { businessId };

  if (filter?.itemType) where.itemType = filter.itemType;
  if (filter?.categoryId) where.categoryId = filter.categoryId;
  if (filter?.brandId) where.brandId = filter.brandId;
  if (filter?.unitId) where.unitId = filter.unitId;
  if (filter?.isActive !== undefined) where.isActive = filter.isActive;
  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { sku: { contains: filter.search, mode: "insensitive" } },
      { barcode: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.catalogItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.catalogItem.count({ where }),
  ]);

  return {
    items: items as unknown as CatalogItemWithRelations[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function deleteCatalogItem(id: string): Promise<ActionResponse> {
  try {
    await prisma.catalogItem.delete({ where: { id } });
    return { success: true, message: "Catalog item deleted successfully" };
  } catch (error) {
    console.error("Delete catalog item error:", error);
    return { success: false, message: "Failed to delete catalog item" };
  }
}
