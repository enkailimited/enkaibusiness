import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogForm } from "@/components/ui/dialog-form";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { PurchaseOrderList } from "@/features/purchase-orders/components/purchase-order-list";
import { PurchaseOrderForm } from "@/features/purchase-orders/components/purchase-order-form";

interface Props { params: Promise<{ businessId: string }> }

async function POFormDialog({ businessId }: { businessId: string }) {
  await requireAuth();
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { workspaceId: true },
  });
  if (!business) throw new Error("Business not found");

  const [suppliers, rawItems] = await Promise.all([
    prisma.supplier.findMany({ where: { businessId, isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.catalogItem.findMany({ where: { businessId, isActive: true }, select: { id: true, name: true, sku: true, price: true, costPrice: true }, orderBy: { name: "asc" } }),
  ]);

  const catalogItems = rawItems.map((i) => ({ ...i, price: Number(i.price), costPrice: i.costPrice ? Number(i.costPrice) : null }));

  return (
    <DialogForm title="New Purchase Order" description="Create a purchase order">
      <PurchaseOrderForm businessId={businessId} workspaceId={business.workspaceId} suppliers={suppliers} catalogItems={catalogItems} />
    </DialogForm>
  );
}

export default async function PurchaseOrdersPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Purchase Orders" description="View and manage purchase orders">
        <Suspense fallback={<Skeleton className="h-10 w-28 rounded-lg" />}>
          <POFormDialog businessId={businessId} />
        </Suspense>
      </PageHeader>
      <PurchaseOrderList businessId={businessId} />
    </div>
  );
}
