import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PurchaseList } from "@/features/purchases/components/purchase-list";
import { PurchaseForm } from "@/features/purchases/components/purchase-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { listSuppliers } from "@/features/suppliers/services/supplier-service";
import { listProducts } from "@/features/catalog/products/services/product-service";

interface Props { params: Promise<{ businessId: string }> }

async function PurchaseSection({ businessId }: { businessId: string }) {
  await requireAuth();
  const [business, suppliers, products] = await Promise.all([
    prisma.business.findUnique({ where: { id: businessId }, select: { workspaceId: true } }),
    listSuppliers(businessId),
    listProducts(businessId),
  ]);
  if (!business) throw new Error("Business not found");
  const catalogItems = (products.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
  }));
  const supplierOptions = suppliers.map((s) => ({ id: s.id, name: s.name }));
  return (
    <PurchaseForm
      businessId={businessId}
      workspaceId={business.workspaceId}
      suppliers={supplierOptions}
      catalogItems={catalogItems}
    />
  );
}

export default async function PurchasesPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Purchases" description="Record and manage supplier purchases">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
          <PurchaseSection businessId={businessId} />
        </Suspense>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <PurchaseList businessId={businessId} />
      </Suspense>
    </div>
  );
}
