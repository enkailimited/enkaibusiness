import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { BranchList } from "@/features/branches/components/branch-list";
import { BranchForm } from "@/features/branches/components/branch-form";
import { DialogForm } from "@/components/ui/dialog-form";
import { Skeleton } from "@/components/ui/skeleton";

interface Props { params: Promise<{ businessId: string }> }

export default async function BranchesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Branches" description="Manage business branches and locations">
        <DialogForm title="Create Branch" description="Add a new branch">
          <BranchForm businessId={businessId} />
        </DialogForm>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <BranchList businessId={businessId} />
      </Suspense>
    </div>
  );
}
