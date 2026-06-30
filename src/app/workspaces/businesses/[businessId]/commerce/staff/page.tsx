import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { StaffForm } from "@/features/staff/components/staff-form";
import { StaffManageSection } from "@/features/staff/components/staff-manage-section";
import { DialogForm } from "@/components/ui/dialog-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { getBusinessStaff } from "@/features/staff/services/staff-service";

interface Props { params: Promise<{ businessId: string }> }

async function StaffSection({ businessId }: { businessId: string }) {
  await requireAuth();
  const staff = await getBusinessStaff(businessId);
  return <StaffManageSection businessId={businessId} staff={staff} />;
}

export default async function StaffPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Staff" description="Manage business staff members">
        <DialogForm title="Invite Staff" description="Create user account and send invitation email">
          <StaffForm businessId={businessId} />
        </DialogForm>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <StaffSection businessId={businessId} />
      </Suspense>
    </div>
  );
}
