import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { POSTerminal } from "@/features/pos/components/pos-terminal";

interface Props { params: Promise<{ businessId: string }> }

export default async function POSPage({ params }: Props) {
  const { businessId } = await params;
  await requireAuth();

  const [business, catalogItems, categories, customers, activeSession] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, workspaceId: true, name: true },
    }),
    prisma.catalogItem.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, sku: true, price: true, categoryId: true, imageUrl: true, trackStock: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: { businessId },
      select: { id: true, firstName: true, lastName: true, phone: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.pOSSession.findFirst({
      where: { businessId, status: "open" },
      select: { id: true, openedAt: true, openingFloat: true },
    }),
  ]);

  if (!business) throw new Error("Business not found");

  const products = catalogItems.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    categoryId: p.categoryId,
    imageUrl: p.imageUrl,
    trackStock: p.trackStock,
  }));

  const categoryList = categories.map((c) => ({ id: c.id, name: c.name }));
  const customerList = customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
  }));

  return (
    <POSTerminal
      businessId={business.id}
      workspaceId={business.workspaceId}
      businessName={business.name}
      products={products}
      categories={categoryList}
      customers={customerList}
      activeSession={activeSession ? { id: activeSession.id, openedAt: activeSession.openedAt.toISOString(), openingFloat: Number(activeSession.openingFloat) } : null}
    />
  );
}
