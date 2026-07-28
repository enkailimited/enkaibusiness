import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { getInventoryReport } from "@/features/mining/services/report-service";
import { MiningInventoryClient } from "@/features/mining/components/inventory-client";

export default async function MiningInventoryPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await requireAuth();
  const business = await prisma.business.findFirst({ where: { id: businessId, isActive: true }, select: { id: true } });
  if (!business) notFound();

  const items = await getInventoryReport(businessId);
  const catalogItems = await prisma.catalogItem.findMany({
    where: { businessId, isActive: true },
    select: { id: true, name: true, itemType: true, price: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return <MiningInventoryClient businessId={businessId} items={items} catalogItems={catalogItems} />;
}
