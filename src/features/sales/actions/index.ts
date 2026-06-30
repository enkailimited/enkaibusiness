"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createSale,
  getSale,
  getBusinessSales,
  updateSale,
  voidSale,
  deleteSale,
} from "../services/sale-service";
import { createSaleSchema, updateSaleSchema, saleFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createSaleAction(
  businessId: string,
  workspaceId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const items: Array<{
    catalogItemId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }> = [];

  const itemCount = parseInt(formData.get("itemCount") as string) || 0;
  for (let i = 0; i < itemCount; i++) {
    const catalogItemId = formData.get(`items.${i}.catalogItemId`) as string;
    if (!catalogItemId) continue;
    items.push({
      catalogItemId,
      variantId: (formData.get(`items.${i}.variantId`) as string) || undefined,
      quantity: parseFloat(formData.get(`items.${i}.quantity`) as string) || 0,
      unitPrice: parseFloat(formData.get(`items.${i}.unitPrice`) as string) || 0,
      discount: parseFloat(formData.get(`items.${i}.discount`) as string) || 0,
      subtotal: parseFloat(formData.get(`items.${i}.subtotal`) as string) || 0,
    });
  }

  const parsed = createSaleSchema.safeParse({
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    customerId: formData.get("customerId") || undefined,
    staffId: formData.get("staffId") || undefined,
    saleDate: formData.get("saleDate") || undefined,
    reference: formData.get("reference") || undefined,
    status: formData.get("status") || "completed",
    paymentType: formData.get("paymentType") || "cash",
    amountPaid: formData.get("amountPaid") || 0,
    dueDate: formData.get("dueDate") || undefined,
    discountTotal: formData.get("discountTotal") || 0,
    taxTotal: formData.get("taxTotal") || 0,
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createSale(parsed.data, businessId, workspaceId, user.id);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/sales`);
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/pos`);
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/receivables`);
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/invoices`);
  }

  return result;
}

export async function updateSaleAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const items: Array<{
    catalogItemId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }> = [];

  const itemCount = parseInt(formData.get("itemCount") as string) || 0;
  for (let i = 0; i < itemCount; i++) {
    const catalogItemId = formData.get(`items.${i}.catalogItemId`) as string;
    if (!catalogItemId) continue;
    items.push({
      catalogItemId,
      variantId: (formData.get(`items.${i}.variantId`) as string) || undefined,
      quantity: parseFloat(formData.get(`items.${i}.quantity`) as string) || 0,
      unitPrice: parseFloat(formData.get(`items.${i}.unitPrice`) as string) || 0,
      discount: parseFloat(formData.get(`items.${i}.discount`) as string) || 0,
      subtotal: parseFloat(formData.get(`items.${i}.subtotal`) as string) || 0,
    });
  }

  const parsed = updateSaleSchema.safeParse({
    branchId: formData.get("branchId") || undefined,
    storeId: formData.get("storeId") || undefined,
    customerId: formData.get("customerId") || undefined,
    staffId: formData.get("staffId") || undefined,
    saleDate: formData.get("saleDate") || undefined,
    reference: formData.get("reference") || undefined,
    status: formData.get("status") || undefined,
    discountTotal: formData.get("discountTotal") !== null ? formData.get("discountTotal") : undefined,
    taxTotal: formData.get("taxTotal") !== null ? formData.get("taxTotal") : undefined,
    notes: formData.get("notes") || undefined,
    items: items.length > 0 ? items : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateSale(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/sales`);
  }

  return result;
}

export async function getSaleAction(id: string) {
  await requireAuth();
  return getSale(id);
}

export async function listSalesAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? saleFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return getBusinessSales(businessId, parsed.data);
}

export async function voidSaleAction(id: string, businessId: string) {
  const user = await requireAuth();
  const result = await voidSale(id, user.id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/sales`);
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/pos`);
  }

  return result;
}

export async function deleteSaleAction(id: string, businessId: string) {
  const user = await requireAuth();
  const result = await deleteSale(id, user.id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/sales`);
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/pos`);
  }

  return result;
}