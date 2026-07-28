import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { listFuelTransactions, getFuelStats } from "@/features/mining/services/fuel-service";
import { MiningFuelClient } from "@/features/mining/components/fuel-client";

export default async function MiningFuelPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await requireAuth();
  const business = await prisma.business.findFirst({ where: { id: businessId, isActive: true }, select: { id: true } });
  if (!business) notFound();

  const [transactions, stats] = await Promise.all([
    listFuelTransactions(businessId),
    getFuelStats(businessId),
  ]);

  return <MiningFuelClient businessId={businessId} transactions={transactions} stats={stats} />;
}
