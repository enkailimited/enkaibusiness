import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessActions } from "./business-actions";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { Building2 } from "lucide-react";

interface Props { params: Promise<{ businessId: string }> }

async function BusinessOverview({ businessId }: { businessId: string }) {
  await requireAuth();

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, slug: true, modes: { select: { industry: true, mode: true } } },
  });

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
        <Building2 className="mb-4 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold">Business not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={business.name}
        description={`${business.slug}${business.modes[0] ? ` · ${business.modes[0].industry} · ${business.modes[0].mode}` : ""}`}
      />
      <BusinessActions businessId={businessId} />
    </div>
  );
}

export default async function BusinessDashboardPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
            {Array.from({ length: 16 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full rounded-xl" />))}
          </div>
        </div>
      }
    >
      <BusinessOverview businessId={businessId} />
    </Suspense>
  );
}
