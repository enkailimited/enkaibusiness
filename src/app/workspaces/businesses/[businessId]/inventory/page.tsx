import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogForm } from "@/components/ui/dialog-form";
import { requireAuth } from "@/server/auth";
import { getBusinessLocations } from "@/features/inventory/services/location-service";
import { getBalancesByLocation } from "@/features/inventory/services/balance-service";
import { BalanceList } from "@/features/inventory/components/balance-list";
import { LocationList } from "@/features/inventory/components/location-list";
import { LocationForm } from "@/features/inventory/components/location-form";

interface Props { params: Promise<{ businessId: string }> }

async function InventorySection({ businessId }: { businessId: string }) {
  await requireAuth();
  const [locations, balances] = await Promise.all([
    getBusinessLocations(businessId),
    getBalancesByLocation(businessId),
  ]);

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
  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Inventory" description="Manage stock levels and locations">
        <DialogForm title="Add Location" description="Add a new inventory location">
          <LocationForm businessId={businessId} />
        </DialogForm>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <InventorySection businessId={businessId} />
      </Suspense>
    </div>
  );
}
