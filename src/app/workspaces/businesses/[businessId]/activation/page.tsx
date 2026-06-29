import "server-only";

import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { ActivationDashboard } from "@/features/activation/components/activation-dashboard";

interface Props { params: Promise<{ businessId: string }> }

export default async function ActivationPage({ params }: Props) {
  const { businessId } = await params;
  const user = await requireAuth();

  const hasAccess = await prisma.userRole.findFirst({
    where: { userId: user.id, businessId },
  }) || await prisma.staff.findFirst({
    where: { userId: user.id, businessId, isActive: true },
  }) || await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });

  if (!hasAccess) {
    redirect("/workspaces/dashboard");
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { status: true, name: true },
  });

  if (!business) {
    redirect("/workspaces/dashboard");
  }

  if (business.status === "ACTIVE") {
    redirect(`/workspaces/businesses/${businessId}/overview`);
  }

  return <ActivationDashboard businessId={businessId} />;
}
