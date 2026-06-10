import "server-only";

import { prisma } from "@/server/db";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types/relationships";
import type { CreateCatalogItemSchema } from "@/lib/validations/catalog";

export async function createCatalogItem(
  businessId: string,
  userId: string,
  data: CreateCatalogItemSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const slug = slugify(data.name);

    const item = await prisma.catalogItem.create({
      data: {
        ...data,
        slug,
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
  data: Partial<CreateCatalogItemSchema>,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = { ...data, updatedById: userId };

    if (data.name) {
      updateData.slug = slugify(data.name);
    }

    await prisma.catalogItem.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Catalog item updated successfully" };
  } catch (error) {
    console.error("Update catalog item error:", error);
    return { success: false, message: "Failed to update catalog item" };
  }
}

export async function getCatalogItem(id: string) {
  return prisma.catalogItem.findUnique({ where: { id } });
}

export async function getBusinessCatalog(
  businessId: string,
  options?: {
    itemType?: string;
    category?: string;
    isActive?: boolean;
    search?: string;
  },
) {
  const where: Record<string, unknown> = { businessId };

  if (options?.itemType) where.itemType = options.itemType;
  if (options?.category) where.category = options.category;
  if (options?.isActive !== undefined) where.isActive = options.isActive;
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { sku: { contains: options.search, mode: "insensitive" } },
    ];
  }

  return prisma.catalogItem.findMany({
    where,
    orderBy: { name: "asc" },
  });
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
