import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerList } from "@/features/customers/components/customer-list";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { DialogForm } from "@/components/ui/dialog-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { listGroups } from "@/features/customer-groups/services/group-service";

interface Props { params: Promise<{ businessId: string }> }

async function CustomerFormDialog({ businessId }: { businessId: string }) {
  await requireAuth();
  const groups = await listGroups(businessId);
  return (
    <DialogForm title="Add Customer" description="Add a new customer">
      <CustomerForm businessId={businessId} groups={groups} />
    </DialogForm>
  );
}

export default async function CustomersPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Customers" description="Manage business customers">
        <Suspense fallback={<Skeleton className="h-10 w-28 rounded-lg" />}>
          <CustomerFormDialog businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <CustomerList businessId={businessId} />
      </Suspense>
    </div>
  );
}
