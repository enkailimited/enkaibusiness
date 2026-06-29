import "server-only";

import { prisma } from "@/server/db";
import { searchService } from "@/server/search";
import type { ActionResponse } from "@/types/relationships";
import type { CreateSupplierSchema, UpdateSupplierSchema, SupplierFilterSchema } from "../schemas";
import type { Supplier, SupplierWithCount } from "../types";

export async function createSupplier(
  data: CreateSupplierSchema,
  businessId: string,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const supplier = await prisma.supplier.create({
      data: { ...data, businessId },
    });

    return {
      success: true,
      message: "Supplier created successfully",
      data: { id: supplier.id },
    };
  } catch (error) {
    console.error("Create supplier error:", error);
    return { success: false, message: "Failed to create supplier" };
  }
}

export async function updateSupplier(
  id: string,
  data: UpdateSupplierSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    return {
      success: true,
      message: "Supplier updated successfully",
      data: { id: supplier.id },
    };
  } catch (error) {
    console.error("Update supplier error:", error);
    return { success: false, message: "Failed to update supplier" };
  }
}

export async function getSupplier(id: string): Promise<SupplierWithCount | null> {
  const raw = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { purchases: true, purchaseOrders: true } } },
  });

  if (!raw) return null;
  return raw as unknown as SupplierWithCount;
}

export async function listSuppliers(
  businessId: string,
  filter?: SupplierFilterSchema,
): Promise<SupplierWithCount[]> {
  const result = await searchService.suppliers<any>({
    query: filter?.search,
    businessId,
    where: {
      ...(filter?.supplierType ? { supplierType: filter.supplierType } : {}),
      ...(filter?.country ? { country: filter.country } : {}),
      ...(filter?.isActive !== undefined ? { isActive: filter.isActive } : {}),
    },
    include: { _count: { select: { purchases: true, purchaseOrders: true } } },
    orderBy: { name: "asc" },
  });

  return result.items;
}

export async function deleteSupplier(id: string): Promise<ActionResponse> {
  try {
    await prisma.supplier.delete({ where: { id } });
    return { success: true, message: "Supplier deleted successfully" };
  } catch (error) {
    console.error("Delete supplier error:", error);
    return { success: false, message: "Failed to delete supplier" };
  }
}
