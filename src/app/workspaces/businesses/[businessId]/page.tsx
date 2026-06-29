import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessActions } from "./business-actions";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { Building2, GitBranch, Users, CircleUser } from "lucide-react";

interface Props { params: Promise<{ businessId: string }> }

async function BusinessOverview({ businessId }: { businessId: string }) {
  await requireAuth();

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      _count: { select: { branches: true, staff: true, customers: true } },
      modes: { select: { industry: true, mode: true } },
    },
  });

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
        <Building2 className="mb-4 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold">Business not found</p>
      </div>
    );
  }

  const stats = [
    { label: "Branches", value: business._count.branches, icon: GitBranch, color: "text-blue-600" },
    { label: "Staff", value: business._count.staff, icon: Users, color: "text-indigo-600" },
    { label: "Customers", value: business._count.customers, icon: CircleUser, color: "text-violet-600" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={business.name}
        description={`${business.slug}${business.modes[0] ? ` · ${business.modes[0].industry} · ${business.modes[0].mode}` : ""}`}
      />

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <BusinessActions businessId={businessId} />

      {business.email || business.phone ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {business.email && <p>Email: {business.email}</p>}
            {business.phone && <p>Phone: {business.phone}</p>}
            {business.address && <p>Address: {business.address}</p>}
            <p>Currency: {business.currency} · Timezone: {business.timezone}</p>
          </CardContent>
        </Card>
      ) : null}
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
          <div className="grid gap-4 grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full rounded-xl" />))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <BusinessOverview businessId={businessId} />
    </Suspense>
  );
}
