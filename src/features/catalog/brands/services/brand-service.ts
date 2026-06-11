import "server-only";

import { prisma } from "@/server/db";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types/relationships";
import type { CreateBrandSchema, UpdateBrandSchema } from "../schemas";
import type { BrandWithCount } from "../types";

export async function createBrand(
  businessId: string,
  data: CreateBrandSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const slug = slugify(data.name);

    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        slug,
        businessId,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
      },
    });

    return {
      success: true,
      message: "Brand created successfully",
      data: { id: brand.id },
    };
  } catch (error) {
    console.error("Create brand error:", error);
    return { success: false, message: "Failed to create brand" };
  }
}

export async function updateBrand(
  id: string,
  data: UpdateBrandSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const updateData: Record<string, unknown> = {
      ...data,
      slug: data.name ? slugify(data.name) : undefined,
    };

    await prisma.brand.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: "Brand updated successfully",
      data: { id },
    };
  } catch (error) {
    console.error("Update brand error:", error);
    return { success: false, message: "Failed to update brand" };
  }
}

export async function getBrand(id: string) {
  return prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { catalogItems: true } } },
  });
}

export async function getBusinessBrands(businessId: string): Promise<BrandWithCount[]> {
  const brands = await prisma.brand.findMany({
    where: { businessId },
    include: { _count: { select: { catalogItems: true } } },
    orderBy: { name: "asc" },
  });

  return brands as unknown as BrandWithCount[];
}

export async function deleteBrand(id: string): Promise<ActionResponse> {
  try {
    await prisma.brand.delete({ where: { id } });
    return { success: true, message: "Brand deleted successfully" };
  } catch (error) {
    console.error("Delete brand error:", error);
    return { success: false, message: "Failed to delete brand" };
  }
}
