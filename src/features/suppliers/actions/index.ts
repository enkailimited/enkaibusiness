"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createSupplier,
  updateSupplier,
  getSupplier,
  listSuppliers,
  deleteSupplier,
} from "../services/supplier-service";
import { createSupplierSchema, updateSupplierSchema, supplierFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createSupplierAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createSupplierSchema.safeParse({
    supplierType: formData.get("supplierType") || "local",
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    country: formData.get("country") || "Tanzania",
    taxId: formData.get("taxId") || undefined,
    paymentTerms: formData.get("paymentTerms") || undefined,
    currency: formData.get("currency") || "TZS",
    isActive: formData.get("isActive") ?? true,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createSupplier(parsed.data, businessId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/suppliers`);
  }

  return result;
}

export async function updateSupplierAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateSupplierSchema.safeParse({
    supplierType: formData.get("supplierType") || undefined,
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    country: formData.get("country") || undefined,
    taxId: formData.get("taxId") || undefined,
    paymentTerms: formData.get("paymentTerms") || undefined,
    currency: formData.get("currency") || undefined,
    isActive: formData.get("isActive") !== undefined ? formData.get("isActive") === "true" : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateSupplier(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/suppliers`);
  }

  return result;
}

export async function getSupplierAction(id: string) {
  await requireAuth();
  return getSupplier(id);
}

export async function listSuppliersAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? supplierFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return listSuppliers(businessId, parsed.data);
}

export async function deleteSupplierAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteSupplier(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/suppliers`);
  }
  return result;
}
