import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { BalanceList } from "@/features/inventory/components/balance-list";
import { LocationList } from "@/features/inventory/components/location-list";
import { LocationForm } from "@/features/inventory/components/location-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/server/auth";
import { getBusinessLocations } from "@/features/inventory/services/location-service";
import { getBalancesByLocation } from "@/features/inventory/services/balance-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props { params: Promise<{ businessId: string }> }

async function InventorySection({ businessId }: { businessId: string }) {
  await requireAuth();
  const locations = await getBusinessLocations(businessId);
  const allBalances = await Promise.all(
    locations.map((loc) => getBalancesByLocation(loc.id))
  );
  const balances = allBalances.flat();
  return (
    <Tabs defaultValue="stock">
      <TabsList>
        <TabsTrigger value="stock">Stock Levels</TabsTrigger>
        <TabsTrigger value="locations">Locations</TabsTrigger>
      </TabsList>
      <TabsContent value="stock" className="mt-4">
        <BalanceList balances={balances} />
      </TabsContent>
      <TabsContent value="locations" className="mt-4">
        <LocationList locations={locations} />
      </TabsContent>
    </Tabs>
  );
}

export default async function InventoryPage({ params }: Props) {
  const { businessId } = await params;
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Inventory" description="Manage stock levels and locations">
        <LocationForm businessId={businessId} />
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <InventorySection businessId={businessId} />
      </Suspense>
    </div>
  );
}
