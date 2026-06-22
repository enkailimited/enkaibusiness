import "server-only";

import { prisma } from "@/server/db";

export interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface PublicMenuData {
  businessName: string;
  businessSlug: string;
  code: string;
  items: PublicMenuItem[];
}

export async function getPublicMenuByQRCode(
  code: string,
): Promise<PublicMenuData | null> {
  const qrCode = await prisma.qRCode.findUnique({
    where: { code },
    select: {
      code: true,
      business: {
        select: { id: true, name: true, slug: true },
      },
      menuItems: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        select: {
          isAvailable: true,
          sortOrder: true,
          price: true,
          catalogItem: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  if (!qrCode || !qrCode.business) return null;

  return {
    businessName: qrCode.business.name,
    businessSlug: qrCode.business.slug,
    code: qrCode.code,
    items: qrCode.menuItems.map((mi) => ({
      id: mi.catalogItem.id,
      name: mi.catalogItem.name,
      description: mi.catalogItem.description,
      price: Number(mi.price ?? mi.catalogItem.price),
      imageUrl: mi.catalogItem.imageUrl,
      isAvailable: mi.isAvailable,
      sortOrder: mi.sortOrder,
    })),
  };
}
