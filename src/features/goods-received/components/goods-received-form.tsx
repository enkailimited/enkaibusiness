"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createGoodsReceivedAction } from "../actions";

interface GoodsReceivedFormProps {
  workspaceId: string;
  businessId: string;
  purchaseOrderId?: string;
}

export function GoodsReceivedForm({ workspaceId, businessId, purchaseOrderId }: GoodsReceivedFormProps) {
  const [state, formAction, pending] = useActionState(
    createGoodsReceivedAction.bind(null, workspaceId, businessId),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Goods Received</CardTitle>
        <CardDescription>Enter received goods details</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="businessId" value={businessId} />
          {purchaseOrderId && <input type="hidden" name="purchaseOrderId" value={purchaseOrderId} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input id="reference" name="reference" placeholder="Auto-generated if empty" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedDate">Received Date</Label>
              <Input id="receivedDate" name="receivedDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staffId">Received By (Staff ID)</Label>
            <Input id="staffId" name="staffId" placeholder="Staff UUID" />
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
              <span>Received Qty</span>
              <span>Unit Cost</span>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-end">
                <Input name={`items[${i}][catalogItemId]`} placeholder="Catalog item UUID" />
                <Input name={`items[${i}][expectedQuantity]`} type="number" step="0.01" />
                <Input name={`items[${i}][receivedQuantity]`} type="number" step="0.01" />
                <Input name={`items[${i}][unitCost]`} type="number" step="0.01" />
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
            <p className={state.success ? "text-sm text-success" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Record Goods Received"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
