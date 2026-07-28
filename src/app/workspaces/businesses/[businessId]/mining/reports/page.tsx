import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { getProductionReport, getFuelReport, getEquipmentReport, getInventoryReport, getExpenseReport, getSalesReport } from "@/features/mining/services/report-service";
import { MiningReportsClient } from "@/features/mining/components/reports-client";

export default async function MiningReportsPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await requireAuth();
  const business = await prisma.business.findFirst({ where: { id: businessId, isActive: true }, select: { id: true } });
  if (!business) notFound();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date();
  monthEnd.setHours(23, 59, 59, 999);

  const [production, fuel, equipment, inventory, expenses, sales] = await Promise.all([
    getProductionReport(businessId, monthStart, monthEnd),
    getFuelReport(businessId, monthStart, monthEnd),
    getEquipmentReport(businessId),
    getInventoryReport(businessId),
    getExpenseReport(businessId, monthStart, monthEnd),
    getSalesReport(businessId, monthStart, monthEnd),
  ]);

  return (
    <MiningReportsClient
      production={production}
      fuel={fuel}
      equipment={equipment}
      inventory={inventory}
      expenses={expenses}
      sales={sales}
    />
  );
}
