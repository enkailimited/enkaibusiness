import "server-only";

import { prisma } from "@/server/db";
import { searchService } from "@/server/search";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types/relationships";
import type { CreateCatalogItemSchema, UpdateCatalogItemSchema } from "../schemas";
import type { CatalogItemWithRelations, CatalogItemFilter } from "../types";
import { DEFAULT_PAGE_SIZE } from "../constants";

function serializeCatalogItem(item: Record<string, unknown>): CatalogItemWithRelations {
  return {
    ...item,
    price: Number(item.price),
    costPrice: item.costPrice ? Number(item.costPrice) : null,
    taxRate: item.taxRate ? Number(item.taxRate) : null,
  } as unknown as CatalogItemWithRelations;
}

function getOrCreateDefaultLocation(businessId: string) {
  return prisma.inventoryLocation.findFirst({
    where: { businessId, type: "business" },
  }).then((loc) => {
    if (loc) return loc;
    return prisma.inventoryLocation.create({
      data: { businessId, name: "Main Store", type: "business" },
    });
  });
}

export async function createCatalogItem(
  businessId: string,
  userId: string,
  data: CreateCatalogItemSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const slug = slugify(data.name);
    const { variants, ...itemData } = data;

    const item = await prisma.catalogItem.create({
      data: {
        ...itemData,
        slug,
        description: itemData.description || null,
        sku: itemData.sku || null,
        barcode: itemData.barcode || null,
        catalogTypeId: itemData.catalogTypeId || null,
        categoryId: itemData.categoryId || null,
        brandId: itemData.brandId || null,
        unitId: itemData.unitId || null,
        isService: itemData.isService ?? false,
        trackStock: itemData.trackStock ?? true,
        imageUrl: itemData.imageUrl || null,
        isActive: itemData.isActive ?? true,
        metadata: itemData.metadata ?? {},
        businessId,
        createdById: userId,
        updatedById: userId,
        variants: variants && variants.length > 0
          ? {
              create: variants.map((v, idx) => ({
                name: v.name,
                sku: v.sku || undefined,
                barcode: v.barcode || undefined,
                sortOrder: v.sortOrder ?? idx,
              })),
            }
          : undefined,
      },
    });

    const location = await getOrCreateDefaultLocation(businessId);
    await prisma.inventoryBalance.create({
      data: { locationId: location.id, catalogItemId: item.id },
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
      data: serializeCatalogItem(item as unknown as Record<string, unknown>),
    };
  } catch (error) {
    console.error("Update catalog item error:", error);
    return { success: false, message: "Failed to update catalog item" };
  }
}

const fullInclude = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  unit: { select: { id: true, name: true, abbreviation: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  updatedBy: { select: { id: true, firstName: true, lastName: true } },
  variants: { orderBy: { sortOrder: "asc" as const } },
} as const;

export async function getCatalogItem(id: string): Promise<CatalogItemWithRelations | null> {
  const item = await prisma.catalogItem.findUnique({
    where: { id },
    include: fullInclude,
  });
  return item ? serializeCatalogItem(item as unknown as Record<string, unknown>) : null;
}

export async function getBusinessCatalog(
  businessId: string,
  filter?: CatalogItemFilter,
): Promise<{ items: CatalogItemWithRelations[]; total: number; page: number; totalPages: number }> {
  const page = filter?.page ?? 1;
  const limit = filter?.limit ?? DEFAULT_PAGE_SIZE;

  const result = await searchService.catalogItems<any>({
    query: filter?.search,
    businessId,
    where: {
      ...(filter?.itemType ? { itemType: filter.itemType } : {}),
      ...(filter?.categoryId ? { categoryId: filter.categoryId } : {}),
      ...(filter?.brandId ? { brandId: filter.brandId } : {}),
      ...(filter?.unitId ? { unitId: filter.unitId } : {}),
      ...(filter?.isActive !== undefined ? { isActive: filter.isActive } : {}),
    },
    include: fullInclude,
    orderBy: { name: "asc" },
    offset: (page - 1) * limit,
    limit,
  });

  return {
    items: result.items.map((item) => serializeCatalogItem(item as unknown as Record<string, unknown>)),
    total: result.total,
    page,
    totalPages: Math.ceil(result.total / limit),
  };
}

async function hasTransactionalHistory(id: string): Promise<boolean> {
  const [
    saleItemCount,
    purchaseItemCount,
    balanceCount,
    stockMovementCount,
    goodsReceivedItemCount,
    purchaseOrderItemCount,
    returnItemCount,
    stockAdjustmentItemCount,
    stockTransferItemCount,
    quotationItemCount,
    invoiceItemCount,
    qrMenuItemCount,
  ] = await Promise.all([
    prisma.saleItem.count({ where: { catalogItemId: id } }),
    prisma.purchaseItem.count({ where: { catalogItemId: id } }),
    prisma.inventoryBalance.count({ where: { catalogItemId: id } }),
    prisma.stockMovement.count({ where: { catalogItemId: id } }),
    prisma.goodsReceivedItem.count({ where: { catalogItemId: id } }),
    prisma.purchaseOrderItem.count({ where: { catalogItemId: id } }),
    prisma.returnItem.count({ where: { catalogItemId: id } }),
    prisma.stockAdjustmentItem.count({ where: { catalogItemId: id } }),
    prisma.stockTransferItem.count({ where: { catalogItemId: id } }),
    prisma.quotationItem.count({ where: { catalogItemId: id } }),
    prisma.invoiceItem.count({ where: { catalogItemId: id } }),
    prisma.qRMenuItem.count({ where: { catalogItemId: id } }),
  ]);

  return (
    saleItemCount > 0 ||
    purchaseItemCount > 0 ||
    balanceCount > 0 ||
    stockMovementCount > 0 ||
    goodsReceivedItemCount > 0 ||
    purchaseOrderItemCount > 0 ||
    returnItemCount > 0 ||
    stockAdjustmentItemCount > 0 ||
    stockTransferItemCount > 0 ||
    quotationItemCount > 0 ||
    invoiceItemCount > 0 ||
    qrMenuItemCount > 0
  );
}

export async function deleteCatalogItem(
  id: string,
  userId?: string,
): Promise<ActionResponse> {
  try {
    const hasHistory = await hasTransactionalHistory(id);
    if (hasHistory) {
      return {
        success: false,
        message: "This item has transactional history and cannot be permanently deleted. Archive it instead.",
      };
    }

    await prisma.catalogItem.delete({ where: { id } });

    if (userId) {
      const { createAuditLog } = await import("@/server/services/audit-service");
      await createAuditLog(userId, "DELETE", "catalog_item", id);
    }

    return { success: true, message: "Catalog item deleted successfully" };
  } catch (error) {
    console.error("Delete catalog item error:", error);
    return { success: false, message: "Failed to delete catalog item" };
  }
}
