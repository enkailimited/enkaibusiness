import "server-only";

import { prisma } from "@/server/db";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types/relationships";
import type { CreateCategorySchema, UpdateCategorySchema } from "../schemas";
import type { CategoryWithChildren } from "../types";

export async function createCategory(
  businessId: string,
  data: CreateCategorySchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    let slug = slugify(data.name);

    const existing = await prisma.category.findFirst({
      where: { businessId, slug: { startsWith: slug } },
      select: { slug: true },
      orderBy: { slug: "desc" },
    });

    if (existing) {
      const match = existing.slug.match(new RegExp(`^${slug}-(\\d+)$`));
      const nextNum = match ? parseInt(match[1]!, 10) + 1 : 1;
      slug = `${slug}-${nextNum}`;
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        businessId,
        parentId: data.parentId || null,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return {
      success: true,
      message: "Category created successfully",
      data: { id: category.id },
    };
  } catch (error) {
    console.error("Create category error:", error);
    return { success: false, message: "Failed to create category" };
  }
}

export async function updateCategory(
  id: string,
  data: UpdateCategorySchema,
): Promise<ActionResponse & { data?: { id: string } }> {
  try {
    const existingCat = await prisma.category.findUnique({ where: { id } });
    if (!existingCat) return { success: false, message: "Category not found" };

    const updateData: Record<string, unknown> = { ...data };
    delete updateData.isActive;

    if (data.name) {
      let slug = slugify(data.name);

      const dup = await prisma.category.findFirst({
        where: { businessId: existingCat.businessId, slug, id: { not: id } },
        select: { id: true },
      });

      if (dup) {
        const last = await prisma.category.findFirst({
          where: { businessId: existingCat.businessId, slug: { startsWith: slug }, id: { not: id } },
          select: { slug: true },
          orderBy: { slug: "desc" },
        });
        const match = last?.slug.match(new RegExp(`^${slug}-(\\d+)$`));
        const nextNum = match ? parseInt(match[1]!, 10) + 1 : 1;
        slug = `${slug}-${nextNum}`;
      }

      updateData.slug = slug;
    }

    if (data.parentId !== undefined) updateData.parentId = data.parentId;

    await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: "Category updated successfully",
      data: { id },
    };
  } catch (error) {
    console.error("Update category error:", error);
    return { success: false, message: "Failed to update category" };
  }
}

export async function getCategory(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { catalogItems: true } },
    },
  });
}

function buildCategoryTree(
  categories: Array<{
    id: string;
    businessId: string;
    name: string;
    slug: string;
    parentId: string | null;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    _count?: { catalogItems: number };
  }>,
  parentId: string | null = null,
): CategoryWithChildren[] {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      id: c.id,
      businessId: c.businessId,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      description: c.description,
      imageUrl: c.imageUrl,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      _count: c._count,
      children: buildCategoryTree(categories, c.id),
    }));
}

export async function getBusinessCategories(businessId: string): Promise<CategoryWithChildren[]> {
  const categories = await prisma.category.findMany({
    where: { businessId },
    include: {
      _count: { select: { catalogItems: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return buildCategoryTree(
    categories as Array<{
      id: string;
      businessId: string;
      name: string;
      slug: string;
      parentId: string | null;
      description: string | null;
      imageUrl: string | null;
      sortOrder: number;
      isActive: boolean;
      _count?: { catalogItems: number };
    }>,
  );
}

export async function getCategoryChildren(parentId: string) {
  return prisma.category.findMany({
    where: { parentId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategoryHierarchy(businessId: string): Promise<
  Array<{ id: string; name: string; slug: string; level: number; children: unknown[] }>
> {
  const categories = await prisma.category.findMany({
    where: { businessId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  function buildHierarchy(
    items: typeof categories,
    parentId: string | null = null,
    level = 0,
  ): Array<{ id: string; name: string; slug: string; level: number; children: unknown[] }> {
    return items
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        level,
        children: buildHierarchy(items, c.id, level + 1),
      }));
  }

  return buildHierarchy(categories);
}

export async function deleteCategory(id: string): Promise<ActionResponse> {
  try {
    const children = await prisma.category.findMany({ where: { parentId: id } });

    if (children.length > 0) {
      await prisma.category.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      });
    }

    await prisma.category.delete({ where: { id } });
    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("Delete category error:", error);
    return { success: false, message: "Failed to delete category" };
  }
}
