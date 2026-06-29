import "server-only";

import { prisma } from "@/server/db";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types/relationships";
import type { CreateProductSchema, UpdateProductSchema, ProductFilterSchema } from "../schemas";
import type { ProductWithVariants, ProductWithRelations } from "../types";

const productInclude = {
  variants: { orderBy: { sortOrder: "asc" as const } },
  images: { orderBy: { sortOrder: "asc" as const } },
};

const productWithRelationsInclude = {
  ...productInclude,
  variants: {
    include: { images: { orderBy: { sortOrder: "asc" as const } } },
    orderBy: { sortOrder: "asc" as const },
  },
  assignments: {
    include: {
      branch: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: "asc" as const },
  },
  priceListItems: {
    include: {
      priceList: { select: { id: true, name: true, type: true } },
    },
  },
};

export async function createProduct(
  businessId: string,
  userId: string,
  data: CreateProductSchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const slug = slugify(data.name);
    const { variants, ...productData } = data;

    const product = await prisma.catalogItem.create({
      data: {
        ...productData,
        slug,
        businessId,
        createdById: userId,
        updatedById: userId,
        variants: variants && variants.length > 0
          ? {
              create: variants.map((v, i) => ({
                name: v.name,
                sku: v.sku || undefined,
                barcode: v.barcode || undefined,
                price: v.price,
                costPrice: v.costPrice,
                imageUrl: v.imageUrl || undefined,
                attributes: v.attributes ?? {},
                sortOrder: v.sortOrder ?? i,
              })),
            }
          : undefined,
      },
    });

    return {
      success: true,
      message: "Product created successfully",
      data: { id: product.id },
    };
  } catch (error) {
    console.error("Create product error:", error);
    return { success: false, message: "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  userId: string,
  data: UpdateProductSchema,
): Promise<ActionResponse> {
  try {
    const updateData: Record<string, unknown> = { ...data, updatedById: userId };

    if (data.name) {
      updateData.slug = slugify(data.name);
    }

    await prisma.catalogItem.update({
      where: { id },
      data: updateData,
    });

    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    console.error("Update product error:", error);
    return { success: false, message: "Failed to update product" };
  }
}

export async function getProduct(id: string) {
  return prisma.catalogItem.findUnique({
    where: { id },
    include: productWithRelationsInclude,
  }) as Promise<ProductWithRelations | null>;
}

export async function getProductWithVariants(id: string) {
  return prisma.catalogItem.findUnique({
    where: { id },
    include: productInclude,
  }) as Promise<ProductWithVariants | null>;
}

export async function listProducts(
  businessId: string,
  filters?: ProductFilterSchema,
): Promise<ActionResponse & { data?: ProductWithVariants[] }> {
  try {
    const where: Record<string, unknown> = {
      businessId,
      itemType: "PRODUCT",
    };

    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.brandId) where.brandId = filters.brandId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
        { barcode: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters?.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters?.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    let orderBy: Record<string, unknown> = { name: "asc" };
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case "price_asc":
          orderBy = { price: "asc" };
          break;
        case "price_desc":
          orderBy = { price: "desc" };
          break;
        case "createdAt":
          orderBy = { createdAt: "desc" };
          break;
        case "updatedAt":
          orderBy = { updatedAt: "desc" };
          break;
      }
    }

    const products = await prisma.catalogItem.findMany({
      where,
      include: productInclude,
      orderBy,
    });

    return {
      success: true,
      message: "Products retrieved successfully",
      data: products as unknown as ProductWithVariants[],
    };
  } catch (error) {
    console.error("List products error:", error);
    return { success: false, message: "Failed to list products" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResponse> {
  try {
    await prisma.catalogItem.delete({ where: { id } });
    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("Delete product error:", error);
    return { success: false, message: "Failed to delete product" };
  }
}

export async function addProductVariant(
  productId: string,
  data: { name: string; sku?: string; barcode?: string; price?: number; costPrice?: number; imageUrl?: string; attributes?: Record<string, unknown>; sortOrder?: number },
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const maxSort = await prisma.catalogItemVariant.aggregate({
      where: { catalogItemId: productId },
      _max: { sortOrder: true },
    });

    const variant = await prisma.catalogItemVariant.create({
      data: {
        catalogItemId: productId,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        price: data.price,
        costPrice: data.costPrice,
        imageUrl: data.imageUrl,
        attributes: data.attributes ?? {},
        sortOrder: data.sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    return {
      success: true,
      message: "Variant added successfully",
      data: { id: variant.id },
    };
  } catch (error) {
    console.error("Add variant error:", error);
    return { success: false, message: "Failed to add variant" };
  }
}

export async function updateProductVariant(
  id: string,
  data: Partial<{ name: string; sku: string; barcode: string; price: number; costPrice: number; imageUrl: string; attributes: Record<string, unknown>; sortOrder: number }>,
): Promise<ActionResponse> {
  try {
    await prisma.catalogItemVariant.update({
      where: { id },
      data,
    });
    return { success: true, message: "Variant updated successfully" };
  } catch (error) {
    console.error("Update variant error:", error);
    return { success: false, message: "Failed to update variant" };
  }
}

export async function removeProductVariant(id: string): Promise<ActionResponse> {
  try {
    await prisma.catalogItemVariant.delete({ where: { id } });
    return { success: true, message: "Variant removed successfully" };
  } catch (error) {
    console.error("Remove variant error:", error);
    return { success: false, message: "Failed to remove variant" };
  }
}
