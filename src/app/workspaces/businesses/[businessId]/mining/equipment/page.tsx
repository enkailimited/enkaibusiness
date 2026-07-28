import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { listMiningEquipment, getEquipmentStats, getDueForService } from "@/features/mining/services/equipment-service";
import { MiningEquipmentClient } from "@/features/mining/components/equipment-client";

export default async function MiningEquipmentPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await requireAuth();
  const business = await prisma.business.findFirst({ where: { id: businessId, isActive: true }, select: { id: true } });
  if (!business) notFound();

  const [equipment, stats, dueService] = await Promise.all([
    listMiningEquipment(businessId),
    getEquipmentStats(businessId),
    getDueForService(businessId),
  ]);

  return <MiningEquipmentClient businessId={businessId} equipment={equipment} stats={stats} dueService={dueService} />;
}
