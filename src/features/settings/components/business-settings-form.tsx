"use client";

import { useEffect, useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { updateBusinessSettingsAction, getBusinessProfileSettingsAction } from "../actions";
import type { BusinessProfileSettings } from "../types";

interface BusinessSettingsFormProps {
  businessId?: string;
  userId?: string;
}

export function BusinessSettingsForm({ businessId }: BusinessSettingsFormProps) {
  const [settings, setSettings] = useState<BusinessProfileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, formAction, pending] = useActionState(
    updateBusinessSettingsAction.bind(null, businessId ?? ""),
    null,
  );

  useEffect(() => {
    if (!businessId) return;
    getBusinessProfileSettingsAction(businessId).then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, [businessId]);

  if (!businessId) {
    return <p className="text-sm text-muted-foreground">Business context required</p>;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input id="businessName" name="businessName" defaultValue={settings?.businessName ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessPhone">Phone</Label>
          <Input id="businessPhone" name="businessPhone" defaultValue={settings?.businessPhone ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessEmail">Email</Label>
          <Input id="businessEmail" name="businessEmail" type="email" defaultValue={settings?.businessEmail ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" defaultValue={settings?.currency ?? "TZS"} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessAddress">Address</Label>
        <Input id="businessAddress" name="businessAddress" defaultValue={settings?.businessAddress ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={settings?.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue={settings?.timezone ?? "Africa/Dar_es_Salaam"} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateFormat">Date Format</Label>
        <Input id="dateFormat" name="dateFormat" defaultValue={settings?.dateFormat ?? "DD/MM/YYYY"} />
      </div>

      {state?.message && (
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Business Settings"}
      </Button>
    </form>
  );
}
