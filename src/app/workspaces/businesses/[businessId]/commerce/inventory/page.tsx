import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogForm } from "@/components/ui/dialog-form";
import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { getBusinessLocations } from "@/features/inventory/services/location-service";
import { BalanceList } from "@/features/inventory/components/balance-list";
import { LocationList } from "@/features/inventory/components/location-list";
import { LocationForm } from "@/features/inventory/components/location-form";

interface Props { params: Promise<{ businessId: string }> }

async function InventorySection({ businessId }: { businessId: string }) {
  await requireAuth();
  const locations = await getBusinessLocations(businessId);
  const locationIds = locations.map((l) => l.id);
  const balances = locationIds.length > 0
    ? await prisma.inventoryBalance.findMany({
        where: { locationId: { in: locationIds } },
        include: {
          location: { select: { id: true, name: true } },
          catalogItem: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { catalogItem: { name: "asc" } },
      }).then((bs) => bs.map((b) => ({
        ...b,
        quantityOnHand: Number(b.quantityOnHand),
        quantityAvailable: Number(b.quantityAvailable),
        quantityCommitted: Number(b.quantityCommitted),
        reorderPoint: Number(b.reorderPoint),
        maxStock: Number(b.maxStock),
      })))
    : [];

  return (
    <Tabs defaultValue="stock" className="space-y-6">
      <TabsList>
        <TabsTrigger value="stock">Stock Levels</TabsTrigger>
        <TabsTrigger value="locations">Locations</TabsTrigger>
      </TabsList>
      <TabsContent value="stock" className="mt-0">
        <BalanceList balances={balances} />
      </TabsContent>
      <TabsContent value="locations" className="mt-0">
        <LocationList locations={locations} />
      </TabsContent>
    </Tabs>
  );
}

export default async function InventoryPage({ params }: Props) {
  const { businessId } = await params;
  const branches = await prisma.branch.findMany({
    where: { businessId, isActive: true },
    include: {
      stores: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
    orderBy: [{ isHeadOffice: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Inventory" description="Manage stock levels and locations">
        <DialogForm title="Add Location" description="Add a new inventory location">
          <LocationForm businessId={businessId} branches={branches} />
        </DialogForm>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <InventorySection businessId={businessId} />
      </Suspense>
    </div>
  );
}
