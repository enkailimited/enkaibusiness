import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { BusinessLayoutClient } from "./business-layout-client";

interface Props {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}

export default async function BusinessLayout({ children, params }: Props) {
  const { businessId } = await params;
  await requireAuth();

  const branches = await prisma.branch.findMany({
    where: { businessId, isActive: true },
    select: { id: true, name: true, isHeadOffice: true },
    orderBy: [{ isHeadOffice: "desc" }, { name: "asc" }],
  });

  return (
    <BusinessLayoutClient businessId={businessId} branches={branches}>
      {children}
    </BusinessLayoutClient>
  );
}
