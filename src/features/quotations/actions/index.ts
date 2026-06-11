"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createQuotation,
  updateQuotation,
  getQuotation,
  getBusinessQuotations,
  deleteQuotation,
  markQuotationAsSent,
  markQuotationAsAccepted,
  markQuotationAsConverted,
  markQuotationAsRejected,
  markQuotationAsExpired,
} from "../services/quotation-service";
import { createQuotationSchema, updateQuotationSchema, quotationFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createQuotationAction(
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

  const parsed = createQuotationSchema.safeParse({
    branchId: formData.get("branchId") || undefined,
    customerId: formData.get("customerId") || undefined,
    staffId: formData.get("staffId") || undefined,
    quoteDate: formData.get("quoteDate") || undefined,
    expiryDate: formData.get("expiryDate") || undefined,
    status: formData.get("status") || "draft",
    tax: formData.get("tax") || 0,
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

  const result = await createQuotation(parsed.data, businessId, workspaceId, user.id);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/quotations`);
  }

  return result;
}

export async function updateQuotationAction(
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

  const parsed = updateQuotationSchema.safeParse({
    branchId: formData.get("branchId") || undefined,
    customerId: formData.get("customerId") || undefined,
    staffId: formData.get("staffId") || undefined,
    quoteDate: formData.get("quoteDate") || undefined,
    expiryDate: formData.get("expiryDate") || undefined,
    status: formData.get("status") || undefined,
    tax: formData.get("tax") !== null ? formData.get("tax") : undefined,
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

  const result = await updateQuotation(id, parsed.data);

  if (result.success) {
    revalidatePath(`/businesses/${businessId}/quotations`);
  }

  return result;
}

export async function getQuotationAction(id: string) {
  await requireAuth();
  return getQuotation(id);
}

export async function listQuotationsAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? quotationFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return getBusinessQuotations(businessId, parsed.data);
}

export async function deleteQuotationAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteQuotation(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/quotations`);
  }
  return result;
}

export async function sendQuotationAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markQuotationAsSent(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/quotations`);
  }
  return result;
}

export async function acceptQuotationAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markQuotationAsAccepted(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/quotations`);
  }
  return result;
}

export async function convertQuotationAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markQuotationAsConverted(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/quotations`);
  }
  return result;
}

export async function rejectQuotationAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markQuotationAsRejected(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/quotations`);
  }
  return result;
}

export async function expireQuotationAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markQuotationAsExpired(id);
  if (result.success) {
    revalidatePath(`/businesses/${businessId}/quotations`);
  }
  return result;
}
