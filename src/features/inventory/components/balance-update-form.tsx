"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBalanceAction } from "../actions";
import type { BalanceWithItem } from "../types";

interface BalanceUpdateFormProps {
  balance: BalanceWithItem;
  onSuccess?: () => void;
}

export function BalanceUpdateForm({ balance, onSuccess }: BalanceUpdateFormProps) {
  const [state, formAction, pending] = useActionState(
    updateBalanceAction.bind(null, balance.id),
    null,
  );

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Update Balance — {balance.catalogItem.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantityOnHand">Quantity On Hand</Label>
            <Input
              id="quantityOnHand"
              name="quantityOnHand"
              type="number"
              step="0.01"
              defaultValue={balance.quantityOnHand}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantityAvailable">Quantity Available</Label>
            <Input
              id="quantityAvailable"
              name="quantityAvailable"
              type="number"
              step="0.01"
              defaultValue={balance.quantityAvailable}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantityCommitted">Quantity Committed</Label>
            <Input
              id="quantityCommitted"
              name="quantityCommitted"
              type="number"
              step="0.01"
              defaultValue={balance.quantityCommitted}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorderPoint">Reorder Point</Label>
            <Input
              id="reorderPoint"
              name="reorderPoint"
              type="number"
              step="0.01"
              defaultValue={balance.reorderPoint}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxStock">Max Stock</Label>
            <Input
              id="maxStock"
              name="maxStock"
              type="number"
              step="0.01"
              defaultValue={balance.maxStock}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchNo">Batch No.</Label>
            <Input
              id="batchNo"
              name="batchNo"
              defaultValue={balance.batchNo ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              name="expiryDate"
              type="date"
              defaultValue={
                balance.expiryDate
                  ? new Date(balance.expiryDate).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving..." : "Update Balance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
