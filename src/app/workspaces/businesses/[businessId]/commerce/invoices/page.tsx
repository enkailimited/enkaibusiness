import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceList } from "@/features/invoices/components/invoice-list";
import { InvoiceForm } from "@/features/invoices/components/invoice-form";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogForm } from "@/components/ui/dialog-form";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { listCustomers } from "@/features/customers/services/customer-service";

interface Props { params: Promise<{ businessId: string }> }

async function InvoiceFormDialog({ businessId }: { businessId: string }) {
  await requireAuth();
  const customers = await listCustomers(businessId);
  return (
    <DialogForm title="New Invoice" description="Create a new customer invoice">
      <InvoiceForm
        businessId={businessId}
        customers={customers}
      />
    </DialogForm>
  );
}

export default async function InvoicesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Invoices" description="Manage customer invoices and payments">
        <Suspense fallback={<Skeleton className="h-10 w-28 rounded-lg" />}>
          <InvoiceFormDialog businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <InvoiceList businessId={businessId} />
      </Suspense>
    </div>
  );
}
