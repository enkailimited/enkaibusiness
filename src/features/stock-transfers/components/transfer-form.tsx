"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createTransferAction } from "../actions";

interface TransferFormProps {
  businessId: string;
}

export function TransferForm({ businessId }: TransferFormProps) {
  const [state, formAction, pending] = useActionState(
    createTransferAction.bind(null, businessId),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Stock Transfer</CardTitle>
        <CardDescription>Transfer stock between locations</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromLocationId">From Location</Label>
              <Input id="fromLocationId" name="fromLocationId" placeholder="Source location UUID" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toLocationId">To Location</Label>
              <Input id="toLocationId" name="toLocationId" placeholder="Destination location UUID" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessToId">Destination Business</Label>
            <Input id="businessToId" name="businessToId" placeholder="Destination business UUID" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transferDate">Transfer Date</Label>
              <Input id="transferDate" name="transferDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <Label>Items</Label>
            <div className="grid grid-cols-2 gap-2 text-sm font-medium text-muted-foreground">
              <span>Catalog Item ID</span>
              <span>Quantity</span>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-2 gap-2 items-end">
                <Input name={`items[${i}][catalogItemId]`} placeholder="Catalog item UUID" />
                <Input name={`items[${i}][quantity]`} type="number" step="0.01" min="0.01" />
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
            {pending ? "Saving..." : "Create Transfer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
