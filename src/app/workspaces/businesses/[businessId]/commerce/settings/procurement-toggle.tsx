"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdvancedProcurementAction, setAdvancedProcurementAction } from "@/features/procurement/actions";

export function ProcurementSettingsToggle({ businessId }: { businessId: string }) {
  const [advanced, setAdvanced] = useState<boolean | null>(null);

  useEffect(() => {
    getAdvancedProcurementAction(businessId).then(setAdvanced);
  }, [businessId]);

  const handleToggle = async (checked: boolean) => {
    setAdvanced(checked);
    await setAdvancedProcurementAction(businessId, checked);
  };

  if (advanced === null) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Procurement Mode</CardTitle>
        <CardDescription className="text-xs">
          Enable Purchase Orders and Goods Received workflows for advanced procurement control
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="advancedProcurement" className="text-sm font-medium">Advanced Procurement</Label>
            <p className="text-xs text-muted-foreground">
              {advanced
                ? "Purchase Orders and Goods Received are visible. Inventory updates only on Goods Received."
                : "Direct purchase workflow. Inventory updates immediately on purchase creation."}
            </p>
          </div>
          <Switch id="advancedProcurement" checked={advanced} onCheckedChange={handleToggle} />
        </div>
      </CardContent>
    </Card>
  );
}
