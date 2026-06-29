import "server-only";

import { prisma } from "@/server/db";
import { searchService } from "@/server/search";
import type { ActionResponse } from "@/types/relationships";
import type { CreateCustomerSchema, UpdateCustomerSchema, CustomerFilterSchema } from "../schemas";
import type { Customer, CustomerWithGroup, CustomerWithRelations } from "../types";

function toCustomer(raw: Record<string, unknown>): Customer {
  return {
    ...raw,
    creditLimit: Number(raw.creditLimit),
  } as unknown as Customer;
}

function toCustomerWithGroup(raw: Record<string, unknown>): CustomerWithGroup {
  const customer = toCustomer(raw);
  const group = raw.customerGroup
    ? { ...(raw.customerGroup as Record<string, unknown>), discountPercent: Number((raw.customerGroup as Record<string, unknown>).discountPercent) }
    : null;
  return { ...customer, customerGroup: group as CustomerWithGroup["customerGroup"] };
}

export async function createCustomer(
  data: CreateCustomerSchema,
  businessId: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { customerGroupId, contactId, metadata, ...rest } = data;

    const customer = await prisma.customer.create({
      data: {
        ...rest,
        businessId,
        contactId: contactId || null,
        customerGroupId: customerGroupId || null,
        metadata: metadata ?? undefined,
      },
      include: { customerGroup: true },
    });

    return {
      success: true,
      message: "Customer created successfully",
      data: { id: customer.id },
    };
  } catch (error) {
    console.error("Create customer error:", error);
    return { success: false, message: "Failed to create customer" };
  }
}

export async function updateCustomer(
  id: string,
  data: UpdateCustomerSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const { customerGroupId, metadata, ...rest } = data;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        customerGroupId: customerGroupId === "" ? null : customerGroupId,
        metadata: metadata ?? undefined,
      },
    });

    return {
      success: true,
      message: "Customer updated successfully",
      data: { id: customer.id },
    };
  } catch (error) {
    console.error("Update customer error:", error);
    return { success: false, message: "Failed to update customer" };
  }
}

export async function getCustomer(id: string): Promise<CustomerWithGroup | null> {
  const raw = await prisma.customer.findUnique({
    where: { id },
    include: { customerGroup: true },
  });

  if (!raw) return null;
  return toCustomerWithGroup(raw as unknown as Record<string, unknown>);
}

export async function listCustomers(
  businessId: string,
  filter?: CustomerFilterSchema,
): Promise<CustomerWithGroup[]> {
  const result = await searchService.customers<any>({
    query: filter?.search,
    businessId,
    where: {
      ...(filter?.customerType ? { customerType: filter.customerType } : {}),
      ...(filter?.customerGroupId ? { customerGroupId: filter.customerGroupId } : {}),
      ...(filter?.isActive !== undefined ? { isActive: filter.isActive } : {}),
    },
    include: { customerGroup: true },
    orderBy: { createdAt: "desc" },
  });

  return result.items.map(toCustomerWithGroup);
}

export async function deleteCustomer(id: string): Promise<ActionResponse> {
  try {
    await prisma.customer.delete({ where: { id } });
    return { success: true, message: "Customer deleted successfully" };
  } catch (error) {
    console.error("Delete customer error:", error);
    return { success: false, message: "Failed to delete customer" };
  }
}
