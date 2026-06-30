"use client";

import { useEffect, useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { updateTaxSettingsAction, getTaxSettingsAction } from "../actions";
import type { TaxSettings } from "../types";

interface TaxSettingsFormProps {
  businessId?: string;
  userId?: string;
}

export function TaxSettingsForm({ businessId }: TaxSettingsFormProps) {
  const [settings, setSettings] = useState<TaxSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, formAction, pending] = useActionState(
    updateTaxSettingsAction.bind(null, businessId ?? ""),
    null,
  );

  useEffect(() => {
    if (!businessId) return;
    getTaxSettingsAction(businessId).then((data) => {
      setSettings(data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [businessId]);

  if (!businessId) {
    return <p className="text-sm text-muted-foreground">Business context required</p>;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taxName">Tax Name</Label>
          <Input id="taxName" name="taxName" defaultValue={settings?.taxName ?? "VAT"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input id="taxRate" name="taxRate" type="number" step="0.01" defaultValue={settings?.taxRate?.toString() ?? "18"} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tin">TIN Number</Label>
        <Input id="tin" name="tin" defaultValue={settings?.tin ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vatRate">VAT Rate (%)</Label>
          <Input id="vatRate" name="vatRate" type="number" step="0.01" defaultValue={settings?.vatRate?.toString() ?? "18"} />
        </div>
        <div className="flex items-end pb-2 gap-2">
          <input
            id="isVATRegistered"
            name="isVATRegistered"
            type="checkbox"
            defaultChecked={settings?.isVATRegistered ?? false}
            className="h-4 w-4"
          />
          <Label htmlFor="isVATRegistered">VAT Registered</Label>
        </div>
      </div>

      {state?.message && (
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Tax Settings"}
      </Button>
    </form>
  );
}
