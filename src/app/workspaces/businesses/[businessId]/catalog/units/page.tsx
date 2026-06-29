"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { UnitList } from "@/features/catalog/units/components/unit-list";
import { UnitForm } from "@/features/catalog/units/components/unit-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UnitsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = useCallback(() => {
    setDialogOpen(false);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Units of Measure" description="Manage catalog measurement units">
        <Button onClick={() => setDialogOpen(true)} className="h-11 rounded-xl bg-blue-600 px-6 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700">
          Add Unit
        </Button>
      </PageHeader>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <UnitList key={refreshKey} businessId={businessId} />
      </Suspense>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Unit</DialogTitle>
            <DialogDescription>Add a new unit of measure</DialogDescription>
          </DialogHeader>
          <UnitForm mode="create" businessId={businessId} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
