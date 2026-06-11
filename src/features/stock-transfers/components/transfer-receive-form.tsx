"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { receiveTransferAction } from "../actions";
import type { TransferWithRelations } from "../types";

interface TransferReceiveFormProps {
  transfer: TransferWithRelations;
  businessId: string;
}

export function TransferReceiveForm({ transfer, businessId }: TransferReceiveFormProps) {
  const [state, formAction, pending] = useActionState(
    receiveTransferAction.bind(null, transfer.id, businessId),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receive Transfer</CardTitle>
        <CardDescription>
          Record received quantities for transfer from {transfer.fromLocation?.name} to {transfer.toLocation?.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="border rounded-lg p-4 space-y-4">
            <Label>Items</Label>
            <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground">
              <span>Item</span>
              <span>Sent Qty</span>
              <span>Received Qty</span>
            </div>
            {transfer.items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-3 gap-2 items-end">
                <input type="hidden" name={`items[${idx}][id]`} value={item.id} />
                <span className="text-sm py-2">{item.catalogItem.name}</span>
                <span className="text-sm py-2">{item.quantity}</span>
                <Input
                  name={`items[${idx}][receivedQuantity]`}
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={Number(item.quantity)}
                />
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
            {pending ? "Processing..." : "Receive Transfer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
