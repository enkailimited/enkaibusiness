import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { getBusinessBranches } from "@/features/branches/services/branch-service";
import { StoreList } from "@/features/stores/components/store-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props { params: Promise<{ businessId: string }> }

async function StoresSection({ businessId }: { businessId: string }) {
  await requireAuth();
  const branches = await getBusinessBranches(businessId);
  if (branches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        No branches found. Create a branch first to add stores.
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {branches.map((branch) => (
        <Card key={branch.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{branch.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <StoreList branchId={branch.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function StoresPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Stores" description="Manage stores within branches">
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <StoresSection businessId={businessId} />
      </Suspense>
    </div>
  );
}
