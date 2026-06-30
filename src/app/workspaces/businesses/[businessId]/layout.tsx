import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { BusinessLayoutClient } from "./business-layout-client";

interface Props {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}

export default async function BusinessLayout({ children, params }: Props) {
  const { businessId } = await params;
  const user = await requireAuth();

  const branches = await prisma.branch.findMany({
    where: { businessId, isActive: true },
    select: { id: true, name: true, isHeadOffice: true },
    orderBy: [{ isHeadOffice: "desc" }, { name: "asc" }],
  });

  const staff = await prisma.staff.findFirst({
    where: { userId: user.id, businessId, isActive: true },
    select: {
      assignments: {
        where: { branchId: { not: null } },
        select: { branchId: true },
        take: 1,
      },
    },
  });
  const assignedBranchId = staff?.assignments?.[0]?.branchId ?? null;

  return (
    <BusinessLayoutClient businessId={businessId} branches={branches} assignedBranchId={assignedBranchId}>
      {children}
    </BusinessLayoutClient>
  );
}
