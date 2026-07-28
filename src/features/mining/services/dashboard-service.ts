import "server-only";
import { prisma } from "@/server/db";
import { getProductionStats, getProductionChartData } from "./production-service";
import { getFuelStats } from "./fuel-service";
import { getEquipmentStats } from "./equipment-service";
import { getMiningSiteStats } from "./site-service";
import { getLicenseStats, getExpiringLicenses } from "./license-service";

export async function getMiningDashboard(businessId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    sites,
    production,
    fuel,
    equipment,
    licenses,
    expiringLicenses,
    productionChart,
    totalSales,
    dueForService,
  ] = await Promise.all([
    getMiningSiteStats(businessId),
    getProductionStats(businessId),
    getFuelStats(businessId),
    getEquipmentStats(businessId),
    getLicenseStats(businessId),
    getExpiringLicenses(businessId),
    getProductionChartData(businessId),
    prisma.sale.aggregate({
      where: { businessId, saleDate: { gte: monthStart } },
      _sum: { grandTotal: true },
    }),
    prisma.miningEquipment.count({
      where: {
        businessId,
        isActive: true,
        status: "OPERATIONAL",
        nextMaintenance: { lte: today },
      },
    }),
  ]);

  return {
    sites,
    production,
    fuel,
    equipment,
    licenses,
    expiringLicenses,
    productionChart,
    monthlySales: Number(totalSales._sum.grandTotal || 0),
    dueForService,
    alerts: {
      expiringLicenses: expiringLicenses.length,
      dueForService,
    },
  };
}

export type MiningDashboard = Awaited<ReturnType<typeof getMiningDashboard>>;
