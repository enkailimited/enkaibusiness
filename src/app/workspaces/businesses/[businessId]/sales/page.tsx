import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SaleList } from "@/features/sales/components/sale-list";
import { SaleForm } from "@/features/sales/components/sale-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { listCustomers } from "@/features/customers/services/customer-service";
import { listProducts } from "@/features/catalog/products/services/product-service";

interface Props { params: Promise<{ businessId: string }> }

async function SaleSection({ businessId }: { businessId: string }) {
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
    <SaleForm
      businessId={businessId}
      workspaceId={business.workspaceId}
      customers={customerOptions}
      catalogItems={catalogItems}
    />
  );
}

export default async function SalesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Sales" description="View and manage sales transactions">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
          <SaleSection businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <SaleList businessId={businessId} />
      </Suspense>
    </div>
  );
}
