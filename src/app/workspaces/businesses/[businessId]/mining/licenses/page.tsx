import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { listMiningLicenses, getLicenseStats, getExpiringLicenses } from "@/features/mining/services/license-service";
import { MiningLicensesClient } from "@/features/mining/components/licenses-client";

export default async function MiningLicensesPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await requireAuth();
  const business = await prisma.business.findFirst({ where: { id: businessId, isActive: true }, select: { id: true } });
  if (!business) notFound();

  const [licenses, stats, expiring] = await Promise.all([
    listMiningLicenses(businessId),
    getLicenseStats(businessId),
    getExpiringLicenses(businessId),
  ]);

  return <MiningLicensesClient businessId={businessId} licenses={licenses} stats={stats} expiring={expiring} />;
}
