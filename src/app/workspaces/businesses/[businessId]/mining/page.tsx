import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { getMiningDashboard } from "@/features/mining/services/dashboard-service";
import { MiningDashboardClient } from "@/features/mining/components/dashboard-client";

export default async function MiningDashboardPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const user = await requireAuth();

  const business = await prisma.business.findFirst({
    where: { id: businessId, isActive: true },
    select: { id: true, name: true },
  });
  if (!business) notFound();

  const dashboard = await getMiningDashboard(businessId);

  return <MiningDashboardClient businessId={businessId} businessName={business.name} dashboard={dashboard} />;
}
