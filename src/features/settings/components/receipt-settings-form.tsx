"use client";

import { useEffect, useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { updateReceiptSettingsAction, getReceiptSettingsAction } from "../actions";
import type { ReceiptSettings } from "../types";

interface ReceiptSettingsFormProps {
  businessId?: string;
  userId?: string;
}

export function ReceiptSettingsForm({ businessId }: ReceiptSettingsFormProps) {
  const [settings, setSettings] = useState<ReceiptSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, formAction, pending] = useActionState(
    updateReceiptSettingsAction.bind(null, businessId ?? ""),
    null,
  );

  useEffect(() => {
    if (!businessId) return;
    getReceiptSettingsAction(businessId).then((data) => {
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
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="header">Receipt Header</Label>
        <Input id="header" name="header" defaultValue={settings?.header ?? ""} placeholder="Thank you for your business!" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="footer">Receipt Footer</Label>
        <Input id="footer" name="footer" defaultValue={settings?.footer ?? ""} placeholder="Goods once sold cannot be returned" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paperSize">Paper Size</Label>
        <select
          id="paperSize"
          name="paperSize"
          defaultValue={settings?.paperSize ?? "80mm"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="80mm">80mm (Thermal)</option>
          <option value="58mm">58mm (Thermal)</option>
          <option value="A4">A4</option>
          <option value="Letter">Letter</option>
        </select>
      </div>

      <div className="space-y-3">
        {([
          { key: "showLogo", label: "Show logo on receipt" },
          { key: "showTax", label: "Show tax breakdown" },
          { key: "showDiscount", label: "Show discount details" },
          { key: "showCustomerInfo", label: "Show customer information" },
        ] as const).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <input
              id={key}
              name={key}
              type="checkbox"
              defaultChecked={(settings as Record<string, boolean | undefined>)?.[key] ?? true}
              className="h-4 w-4"
            />
            <Label htmlFor={key}>{label}</Label>
          </div>
        ))}
      </div>

      {state?.message && (
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Receipt Settings"}
      </Button>
    </form>
  );
}
