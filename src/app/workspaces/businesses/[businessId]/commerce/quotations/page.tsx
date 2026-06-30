import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { QuotationList } from "@/features/quotations/components/quotation-list";
import { QuotationForm } from "@/features/quotations/components/quotation-form";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogForm } from "@/components/ui/dialog-form";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { listCustomers } from "@/features/customers/services/customer-service";
import { listProducts } from "@/features/catalog/products/services/product-service";

interface Props { params: Promise<{ businessId: string }> }

async function QuotationFormDialog({ businessId }: { businessId: string }) {
  await requireAuth();
  const [business, customers, products] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId }, select: { workspaceId: true } }),
    listCustomers(businessId),
    listProducts(businessId),
  ]);
  if (!business) throw new Error("Business not found");
  const catalogItems = (products.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
  }));
  const customerOptions = customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
  }));
  return (
    <DialogForm title="New Quotation" description="Create a new customer quotation">
      <QuotationForm
        businessId={businessId}
        workspaceId={business.workspaceId}
        customers={customerOptions}
        catalogItems={catalogItems}
      />
    </DialogForm>
  );
}

export default async function QuotationsPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Quotations" description="Create and manage customer quotations">
        <Suspense fallback={<Skeleton className="h-10 w-28 rounded-lg" />}>
          <QuotationFormDialog businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <QuotationList businessId={businessId} />
      </Suspense>
    </div>
  );
}
