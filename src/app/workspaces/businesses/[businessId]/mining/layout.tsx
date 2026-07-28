import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { MiningSidebar } from "@/features/mining/components/mining-sidebar";

export default async function MiningLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const user = await requireAuth();
  const business = await prisma.business.findFirst({
    where: { id: businessId, isActive: true },
    select: { id: true, name: true, slug: true },
  });
  if (!business) notFound();

  return (
    <div className="flex h-full">
      <MiningSidebar businessId={businessId} businessName={business.name} />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
