"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import { hasPermission } from "@/features/roles/services/assignment-service";
import { createCatalogItem, updateCatalogItem, getCatalogItem as getCatalogItemSvc, deleteCatalogItem } from "../services/catalog-service";
import { createCatalogItemSchema, updateCatalogItemSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

function revalidateCatalog(prefix: string) {
  revalidatePath(`${prefix}/commerce/catalog`);
}

export async function createCatalogItemAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const canCreate = await hasPermission(user.id, "catalog.create", businessId);
  if (!canCreate) {
    return { success: false, message: "You do not have permission to create catalog items" };
  }

  const variants: Array<Record<string, unknown>> = [];
  let i = 0;
  while (formData.has(`variants.${i}.name`)) {
    const name = formData.get(`variants.${i}.name`) as string;
    if (name) {
      variants.push({
        name,
        sku: formData.get(`variants.${i}.sku`) || undefined,
        barcode: formData.get(`variants.${i}.barcode`) || undefined,
        sortOrder: i,
      });
    }
    i++;
  }

  const parsed = createCatalogItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    itemType: formData.get("itemType"),
    categoryId: formData.get("categoryId") || undefined,
    brandId: formData.get("brandId") || undefined,
    unitId: formData.get("unitId") || undefined,
    isService: formData.get("isService") === "true" || formData.get("isService") === "on",
    trackStock: formData.get("trackStock") !== "false" && formData.get("trackStock") !== "off",
    imageUrl: formData.get("imageUrl") || undefined,
    isActive: true,
    variants: variants.length > 0 ? variants : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createCatalogItem(businessId, user.id, parsed.data);

  if (result.success) {
    revalidateCatalog(`/workspaces/businesses/${businessId}`);
  }

  return result;
}

export async function updateCatalogItemAction(
  itemId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const existing = await getCatalogItemSvc(itemId);
  if (!existing) {
    return { success: false, message: "Catalog item not found" };
  }

  const canUpdate = await hasPermission(user.id, "catalog.update", existing.businessId);
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to update catalog items" };
  }

  const parsed = updateCatalogItemSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    itemType: formData.get("itemType") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    brandId: formData.get("brandId") || undefined,
    unitId: formData.get("unitId") || undefined,
    isService: formData.get("isService") === "true" || formData.get("isService") === "on",
    trackStock: formData.get("trackStock") !== "false" && formData.get("trackStock") !== "off",
    imageUrl: formData.get("imageUrl") || undefined,
    isActive: formData.get("isActive") !== undefined ? formData.get("isActive") === "true" : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateCatalogItem(itemId, user.id, parsed.data);

  if (result.success) {
    revalidateCatalog(`/workspaces/businesses/${existing.businessId}`);
  }

  return result;
}

export async function getCatalogItemAction(id: string) {
  const user = await requireAuth();
  const item = await getCatalogItemSvc(id);
  if (!item) {
    return null;
  }
  const canRead = await hasPermission(user.id, "catalog.read", item.businessId);
  if (!canRead) {
    return null;
  }
  return item;
}

export async function listCatalogItemsAction(
  businessId: string,
  filter?: { itemType?: string; categoryId?: string; brandId?: string; search?: string; page?: number; limit?: number },
) {
  const user = await requireAuth();
  const canList = await hasPermission(user.id, "catalog.list", businessId);
  if (!canList) {
    return { items: [], total: 0, page: 1, totalPages: 0 };
  }
  return import("../services/catalog-service").then((m) => m.getBusinessCatalog(businessId, filter));
}

export async function deleteCatalogItemAction(
  businessId: string,
  itemId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const canDelete = await hasPermission(user.id, "catalog.delete", businessId);
  if (!canDelete) {
    return { success: false, message: "You do not have permission to delete catalog items" };
  }
  const result = await deleteCatalogItem(itemId, user.id);

  if (result.success) {
    revalidateCatalog(`/workspaces/businesses/${businessId}`);
  }

  return result;
}

export async function archiveCatalogItemAction(
  businessId: string,
  itemId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const existing = await getCatalogItemSvc(itemId);
  if (!existing) {
    return { success: false, message: "Catalog item not found" };
  }
  const canUpdate = await hasPermission(user.id, "catalog.update", businessId);
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to archive catalog items" };
  }

  const result = await updateCatalogItem(itemId, user.id, { isActive: false });

  if (result.success) {
    const { createAuditLog } = await import("@/server/services/audit-service");
    await createAuditLog(user.id, "ARCHIVE", "catalog_item", itemId, {
      after: { isActive: false },
    });
    revalidateCatalog(`/workspaces/businesses/${businessId}`);
  }

  return result;
}

export async function checkItemHasHistoryAction(itemId: string): Promise<{ hasHistory: boolean }> {
  const { prisma } = await import("@/server/db");
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
    prisma.saleItem.count({ where: { catalogItemId: itemId } }),
    prisma.purchaseItem.count({ where: { catalogItemId: itemId } }),
    prisma.inventoryBalance.count({ where: { catalogItemId: itemId } }),
    prisma.stockMovement.count({ where: { catalogItemId: itemId } }),
    prisma.goodsReceivedItem.count({ where: { catalogItemId: itemId } }),
    prisma.purchaseOrderItem.count({ where: { catalogItemId: itemId } }),
    prisma.returnItem.count({ where: { catalogItemId: itemId } }),
    prisma.stockAdjustmentItem.count({ where: { catalogItemId: itemId } }),
    prisma.stockTransferItem.count({ where: { catalogItemId: itemId } }),
    prisma.quotationItem.count({ where: { catalogItemId: itemId } }),
    prisma.invoiceItem.count({ where: { catalogItemId: itemId } }),
    prisma.qRMenuItem.count({ where: { catalogItemId: itemId } }),
  ]);

  return {
    hasHistory:
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
      qrMenuItemCount > 0,
  };
}

export async function restoreCatalogItemAction(
  businessId: string,
  itemId: string,
): Promise<ActionResponse> {
  const user = await requireAuth();
  const existing = await getCatalogItemSvc(itemId);
  if (!existing) {
    return { success: false, message: "Catalog item not found" };
  }
  const canUpdate = await hasPermission(user.id, "catalog.update", businessId);
  if (!canUpdate) {
    return { success: false, message: "You do not have permission to restore catalog items" };
  }

  const result = await updateCatalogItem(itemId, user.id, { isActive: true });

  if (result.success) {
    const { createAuditLog } = await import("@/server/services/audit-service");
    await createAuditLog(user.id, "RESTORE", "catalog_item", itemId, {
      after: { isActive: true },
    });
    revalidateCatalog(`/workspaces/businesses/${businessId}`);
  }

  return result;
}
