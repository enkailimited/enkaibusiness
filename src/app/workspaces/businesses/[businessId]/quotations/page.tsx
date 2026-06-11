import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { QuotationList } from "@/features/quotations/components/quotation-list";
import { QuotationForm } from "@/features/quotations/components/quotation-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { listCustomers } from "@/features/customers/services/customer-service";
import { listProducts } from "@/features/catalog/products/services/product-service";

interface Props { params: Promise<{ businessId: string }> }

async function QuotationSection({ businessId }: { businessId: string }) {
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
    <QuotationForm
      businessId={businessId}
      workspaceId={business.workspaceId}
      customers={customerOptions}
      catalogItems={catalogItems}
    />
  );
}

export default async function QuotationsPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Quotations" description="Create and manage customer quotations">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
          <QuotationSection businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <QuotationList businessId={businessId} />
      </Suspense>
    </div>
  );
}
