import "server-only";
import { prisma } from "@/server/db";

const DEFAULT_THEMES = [
  { name: "Modern", layout: "modern", headerStyle: "standard", footerStyle: "standard", cardStyle: "rounded", animation: "fade" },
  { name: "Minimal", layout: "minimal", headerStyle: "compact", footerStyle: "minimal", cardStyle: "flat", animation: "none" },
  { name: "Bold", layout: "modern", headerStyle: "hero", footerStyle: "standard", cardStyle: "rounded", animation: "slide" },
  { name: "Classic", layout: "classic", headerStyle: "standard", footerStyle: "classic", cardStyle: "rounded", animation: "fade" },
  { name: "Dark", layout: "modern", headerStyle: "standard", footerStyle: "standard", cardStyle: "rounded", animation: "fade" },
];

function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function createStorefront(data: {
  businessId: string; name: string; tagline?: string; description?: string;
  primaryColor?: string; secondaryColor?: string; accentColor?: string;
}) {
  const subdomain = generateSubdomain(data.name);
  let uniqueSubdomain = subdomain;
  let counter = 1;
  while (await prisma.storefront.findUnique({ where: { subdomain: uniqueSubdomain } })) {
    uniqueSubdomain = `${subdomain}-${counter}`;
    counter++;
  }

  return prisma.$transaction(async (tx) => {
    const storefront = await tx.storefront.create({
      data: {
        businessId: data.businessId,
        subdomain: uniqueSubdomain,
        name: data.name,
        tagline: data.tagline || null,
        description: data.description || null,
        primaryColor: data.primaryColor || "#3B82F6",
        secondaryColor: data.secondaryColor || "#1E40AF",
        accentColor: data.accentColor || "#F59E0B",
        status: "DRAFT",
        isDefault: !(await tx.storefront.findFirst({ where: { businessId: data.businessId, isDefault: true } })),
      },
    });

    // Create default themes
    await tx.storefrontTheme.createMany({
      data: DEFAULT_THEMES.map((t) => ({
        storefrontId: storefront.id,
        name: t.name,
        isActive: t.name === "Modern",
        layout: t.layout,
        headerStyle: t.headerStyle,
        footerStyle: t.footerStyle,
        cardStyle: t.cardStyle,
        animation: t.animation,
      })),
    });

    return storefront;
  });
}

export async function getStorefronts(businessId?: string) {
  const where: Record<string, unknown> = {};
  if (businessId) where.businessId = businessId;

  return prisma.storefront.findMany({
    where,
    select: {
      id: true, name: true, subdomain: true, customDomain: true, status: true,
      primaryColor: true, isDefault: true, publishedAt: true, createdAt: true,
      business: { select: { id: true, name: true } },
      themes: { where: { isActive: true }, select: { name: true, layout: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStorefrontById(id: string) {
  return prisma.storefront.findUnique({
    where: { id },
    include: {
      business: { select: { id: true, name: true, slug: true } },
      themes: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getStorefrontBySubdomain(subdomain: string) {
  const storefront = await prisma.storefront.findUnique({
    where: { subdomain },
    include: {
      business: { select: { id: true, name: true, slug: true, currency: true } },
      themes: { where: { isActive: true }, take: 1 },
    },
  });
  if (!storefront || storefront.status !== "PUBLISHED") return null;
  return storefront;
}

export async function updateStorefront(id: string, data: Partial<{
  name: string; tagline: string; description: string; logoUrl: string;
  primaryColor: string; secondaryColor: string; accentColor: string;
  announcement: string; announcementEnabled: boolean;
  showPrices: boolean; enableCart: boolean; enableBooking: boolean;
  seoTitle: string; seoDescription: string;
}>) {
  return prisma.storefront.update({ where: { id }, data });
}

export async function publishStorefront(id: string) {
  return prisma.storefront.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function archiveStorefront(id: string) {
  return prisma.storefront.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function setActiveTheme(storefrontId: string, themeId: string) {
  await prisma.$transaction([
    prisma.storefrontTheme.updateMany({
      where: { storefrontId, isActive: true },
      data: { isActive: false },
    }),
    prisma.storefrontTheme.update({
      where: { id: themeId },
      data: { isActive: true },
    }),
  ]);
}
