import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { BranchList } from "@/features/branches/components/branch-list";
import { BranchForm } from "@/features/branches/components/branch-form";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { params: Promise<{ businessId: string }> }

export default async function BranchesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Branches" description="Manage business branches and locations">
        <BranchForm businessId={businessId} />
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
        <BranchList businessId={businessId} />
      </Suspense>
    </div>
  );
}
