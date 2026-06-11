"use client";

import { useEffect, useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { updateNumberingSettingsAction, getNumberingSettingsAction } from "../actions";
import type { NumberingSettings } from "../types";

interface NumberingSettingsFormProps {
  businessId?: string;
  userId?: string;
}

export function NumberingSettingsForm({ businessId }: NumberingSettingsFormProps) {
  const [settings, setSettings] = useState<NumberingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, formAction, pending] = useActionState(
    updateNumberingSettingsAction.bind(null, businessId ?? ""),
    null,
  );

  useEffect(() => {
    if (!businessId) return;
    getNumberingSettingsAction(businessId).then((data) => {
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
          <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
          <Input id="invoicePrefix" name="invoicePrefix" defaultValue={settings?.invoicePrefix ?? "INV-"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceLastNumber">Last Invoice #</Label>
          <Input id="invoiceLastNumber" name="invoiceLastNumber" type="number" defaultValue={settings?.invoiceLastNumber?.toString() ?? "0"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchasePrefix">Purchase Prefix</Label>
          <Input id="purchasePrefix" name="purchasePrefix" defaultValue={settings?.purchasePrefix ?? "PO-"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchaseLastNumber">Last Purchase #</Label>
          <Input id="purchaseLastNumber" name="purchaseLastNumber" type="number" defaultValue={settings?.purchaseLastNumber?.toString() ?? "0"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="receiptPrefix">Receipt Prefix</Label>
          <Input id="receiptPrefix" name="receiptPrefix" defaultValue={settings?.receiptPrefix ?? "RCT-"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receiptLastNumber">Last Receipt #</Label>
          <Input id="receiptLastNumber" name="receiptLastNumber" type="number" defaultValue={settings?.receiptLastNumber?.toString() ?? "0"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quotationPrefix">Quotation Prefix</Label>
          <Input id="quotationPrefix" name="quotationPrefix" defaultValue={settings?.quotationPrefix ?? "QTN-"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quotationLastNumber">Last Quotation #</Label>
          <Input id="quotationLastNumber" name="quotationLastNumber" type="number" defaultValue={settings?.quotationLastNumber?.toString() ?? "0"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="creditNotePrefix">Credit Note Prefix</Label>
          <Input id="creditNotePrefix" name="creditNotePrefix" defaultValue={settings?.creditNotePrefix ?? "CN-"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditNoteLastNumber">Last Credit Note #</Label>
          <Input id="creditNoteLastNumber" name="creditNoteLastNumber" type="number" defaultValue={settings?.creditNoteLastNumber?.toString() ?? "0"} />
        </div>
      </div>

      {state?.message && (
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Numbering Settings"}
      </Button>
    </form>
  );
}
