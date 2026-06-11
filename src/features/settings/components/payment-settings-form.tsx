"use client";

import { useEffect, useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { updatePaymentSettingsAction, getPaymentSettingsAction } from "../actions";
import type { PaymentSettings } from "../types";

interface PaymentSettingsFormProps {
  businessId?: string;
  userId?: string;
}

export function PaymentSettingsForm({ businessId }: PaymentSettingsFormProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, formAction, pending] = useActionState(
    updatePaymentSettingsAction.bind(null, businessId ?? ""),
    null,
  );

  useEffect(() => {
    if (!businessId) return;
    getPaymentSettingsAction(businessId).then((data) => {
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
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="defaultPaymentMethod">Default Payment Method</Label>
        <select
          id="defaultPaymentMethod"
          name="defaultPaymentMethod"
          defaultValue={settings?.defaultPaymentMethod ?? "cash"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="credit">Credit</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
        <select
          id="defaultPaymentTerms"
          name="defaultPaymentTerms"
          defaultValue={settings?.defaultPaymentTerms ?? "due_on_receipt"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="due_on_receipt">Due on Receipt</option>
          <option value="net_15">Net 15</option>
          <option value="net_30">Net 30</option>
          <option value="net_60">Net 60</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentDueDays">Payment Due Days</Label>
        <Input id="paymentDueDays" name="paymentDueDays" type="number" min="0" defaultValue={settings?.paymentDueDays?.toString() ?? "0"} />
      </div>

      {state?.message && (
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Payment Settings"}
      </Button>
    </form>
  );
}
