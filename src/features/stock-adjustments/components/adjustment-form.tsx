"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdjustmentAction } from "../actions";
import { COMMON_ADJUSTMENT_REASONS, ADJUSTMENT_REASON_LABELS } from "../constants";

interface AdjustmentFormProps {
  businessId: string;
}

export function AdjustmentForm({ businessId }: AdjustmentFormProps) {
  const [state, formAction, pending] = useActionState(
    createAdjustmentAction.bind(null, businessId),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Stock Adjustment</CardTitle>
        <CardDescription>Enter stock adjustment details</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />

          <div className="space-y-2">
            <Label htmlFor="locationId">Location</Label>
            <Input id="locationId" name="locationId" placeholder="Location UUID" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adjustmentDate">Adjustment Date</Label>
              <Input id="adjustmentDate" name="adjustmentDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <select
                id="reason"
                name="reason"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="">Select reason</option>
                {COMMON_ADJUSTMENT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {ADJUSTMENT_REASON_LABELS[r] ?? r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="notes" name="notes" />
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <Label>Items</Label>
            <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground">
              <span>Catalog Item ID</span>
              <span>Expected Qty</span>
              <span>Actual Qty</span>
              <span>Reason (optional)</span>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-end">
                <Input name={`items[${i}][catalogItemId]`} placeholder="Catalog item UUID" />
                <Input name={`items[${i}][expectedQty]`} type="number" step="0.01" />
                <Input name={`items[${i}][actualQty]`} type="number" step="0.01" />
                <Input name={`items[${i}][reason]`} placeholder="Per-item reason" />
              </div>
            ))}
          </div>

          {state?.errors && (
            <div className="text-sm text-destructive space-y-1">
              {Object.entries(state.errors).map(([field, msgs]) => (
                <p key={field}>{field}: {msgs.join(", ")}</p>
              ))}
            </div>
          )}

          {state?.message && !state.errors && (
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Create Adjustment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
