import { prisma } from "@/server/db";

export async function getBusinessCatalog(businessId: string, options?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    businessId,
    isActive: true,
  };

  if (options?.category) {
    where.category = { slug: options.category };
  }

  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.catalogItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        itemType: true,
        price: true,
        imageUrl: true,
        description: true,
        isService: true,
        trackStock: true,
        category: { select: { id: true, name: true, slug: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
      },
      skip,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.catalogItem.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getCatalogItem(businessId: string, slug: string) {
  return prisma.catalogItem.findFirst({
    where: { businessId, slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      barcode: true,
      itemType: true,
      price: true,
      costPrice: true,
      description: true,
      imageUrl: true,
      isService: true,
      trackStock: true,
      category: { select: { id: true, name: true, slug: true } },
      unit: { select: { id: true, name: true, abbreviation: true } },
      variants: {
        select: { id: true, name: true, sku: true, price: true },
      },
    },
  });
}

export async function getCatalogCategories(businessId: string) {
  return prisma.category.findMany({
    where: { businessId, isActive: true },
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getBusinessBySlug(slug: string) {
  const business = await prisma.business.findFirst({
    where: { slug, isActive: true },
    select: { id: true, workspaceId: true, name: true, slug: true, currency: true },
  });
  if (!business) return null;

  const mode = await prisma.businessMode.findFirst({
    where: { businessId: business.id, isActive: true },
    select: { industry: true, mode: true },
  });

  return { ...business, industry: mode?.industry || "COMMERCE", businessMode: mode?.mode || "retail" };
}
