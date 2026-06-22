"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createCustomer,
  updateCustomer,
  getCustomer,
  listCustomers,
  deleteCustomer,
} from "../services/customer-service";
import { createCustomerSchema, updateCustomerSchema, customerFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createCustomerAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const parsed = createCustomerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    customerType: formData.get("customerType") || "RETAIL",
    customerGroupId: formData.get("customerGroupId") || undefined,
    creditLimit: formData.get("creditLimit") || 0,
    isActive: formData.get("isActive") ?? true,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await createCustomer(parsed.data, businessId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/customers`);
  }

  return result;
}

export async function updateCustomerAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateCustomerSchema.safeParse({
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    customerType: formData.get("customerType") || undefined,
    customerGroupId: formData.get("customerGroupId") || undefined,
    creditLimit: formData.get("creditLimit") || undefined,
    isActive: formData.get("isActive") !== undefined ? formData.get("isActive") === "true" : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateCustomer(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/customers`);
  }

  return result;
}

export async function getCustomerAction(id: string) {
  await requireAuth();
  return getCustomer(id);
}

export async function listCustomersAction(
  businessId: string,
  filter?: Record<string, unknown>,
) {
  await requireAuth();

  const parsed = filter ? customerFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return listCustomers(businessId, parsed.data);
}

export async function deleteCustomerAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteCustomer(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/customers`);
  }
  return result;
}
