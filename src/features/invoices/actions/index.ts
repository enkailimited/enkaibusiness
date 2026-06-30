"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth";
import {
  createInvoice,
  updateInvoice,
  getInvoice,
  getInvoiceWithRelations,
  listInvoices,
  markAsSent,
  recordPayment,
  markAsOverdue,
  deleteInvoice,
} from "../services/invoice-service";
import { createInvoiceSchema, updateInvoiceSchema, invoiceFilterSchema } from "../schemas";
import type { ActionResponse } from "@/types/relationships";

export async function createInvoiceAction(
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const user = await requireAuth();

  const items: Array<{ catalogItemId?: string; description?: string; quantity: number; unitPrice: number }> = [];
  let i = 0;
  while (formData.get(`items[${i}][quantity]`)) {
    items.push({
      catalogItemId: formData.get(`items[${i}][catalogItemId]`) || undefined,
      description: formData.get(`items[${i}][description]`) || undefined,
      quantity: Number(formData.get(`items[${i}][quantity]`)),
      unitPrice: Number(formData.get(`items[${i}][unitPrice]`)),
    });
    i++;
  }

  const parsed = createInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    saleId: formData.get("saleId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
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

  const result = await createInvoice(parsed.data, businessId, user.workspaceId);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/invoices`);
  }

  return result;
}

export async function updateInvoiceAction(
  id: string,
  businessId: string,
  _prevState: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  await requireAuth();

  const parsed = updateInvoiceSchema.safeParse({
    customerId: formData.get("customerId") || undefined,
    saleId: formData.get("saleId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const result = await updateInvoice(id, parsed.data);

  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/invoices`);
  }

  return result;
}

export async function getInvoiceAction(id: string) {
  await requireAuth();
  return getInvoice(id);
}

export async function getInvoiceWithRelationsAction(id: string) {
  await requireAuth();
  return getInvoiceWithRelations(id);
}

export async function listInvoicesAction(
  businessId: string,
  filter?: Record<string, unknown>,
  branchId?: string,
) {
  await requireAuth();

  const parsed = filter ? invoiceFilterSchema.safeParse(filter) : { success: true, data: undefined };

  if (!parsed.success) {
    return [];
  }

  return listInvoices(businessId, parsed.data, branchId);
}

export async function markAsSentAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markAsSent(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/invoices`);
  }
  return result;
}

export async function recordPaymentAction(
  id: string,
  amount: number,
  businessId: string,
) {
  await requireAuth();
  const result = await recordPayment(id, amount);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/invoices`);
  }
  return result;
}

export async function markAsOverdueAction(id: string, businessId: string) {
  await requireAuth();
  const result = await markAsOverdue(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/invoices`);
  }
  return result;
}

export async function deleteInvoiceAction(id: string, businessId: string) {
  await requireAuth();
  const result = await deleteInvoice(id);
  if (result.success) {
    revalidatePath(`/workspaces/businesses/${businessId}/commerce/invoices`);
  }
  return result;
}
