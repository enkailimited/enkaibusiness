import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceList } from "@/features/invoices/components/invoice-list";
import { InvoiceForm } from "@/features/invoices/components/invoice-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { listCustomers } from "@/features/customers/services/customer-service";

interface Props { params: Promise<{ businessId: string }> }

async function InvoiceSection({ businessId }: { businessId: string }) {
  await requireAuth();
  const customers = await listCustomers(businessId);
  return <InvoiceForm businessId={businessId} customers={customers} />;
}

export default async function InvoicesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Invoices" description="Manage customer invoices and payments">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
          <InvoiceSection businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <InvoiceList businessId={businessId} />
      </Suspense>
    </div>
  );
}
