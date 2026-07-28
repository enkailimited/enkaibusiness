import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { listMiningSites, getMiningSiteStats } from "@/features/mining/services/site-service";
import { MiningSitesClient } from "@/features/mining/components/sites-client";

export default async function MiningSitesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const user = await requireAuth();

  const business = await prisma.business.findFirst({
    where: { id: businessId, isActive: true },
    select: { id: true },
  });
  if (!business) notFound();

  const [sites, stats] = await Promise.all([
    listMiningSites(businessId),
    getMiningSiteStats(businessId),
  ]);

  return <MiningSitesClient businessId={businessId} sites={sites} stats={stats} />;
}
