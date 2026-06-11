"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transferStockAction } from "../actions";
import type { LocationWithBalances } from "../types";

interface StockTransferFormProps {
  locations: LocationWithBalances[];
  catalogItemId?: string;
  onSuccess?: () => void;
}

export function StockTransferForm({ locations, catalogItemId, onSuccess }: StockTransferFormProps) {
  const [state, formAction, pending] = useActionState(transferStockAction, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Stock</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromLocationId">From Location</Label>
            <Select name="fromLocationId">
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.fromLocationId && (
              <p className="text-sm text-destructive">{state.errors.fromLocationId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="toLocationId">To Location</Label>
            <Select name="toLocationId">
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.toLocationId && (
              <p className="text-sm text-destructive">{state.errors.toLocationId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="catalogItemId">Catalog Item ID</Label>
            <Input
              id="catalogItemId"
              name="catalogItemId"
              defaultValue={catalogItemId ?? ""}
              placeholder="Item ID"
              required
            />
            {state?.errors?.catalogItemId && (
              <p className="text-sm text-destructive">{state.errors.catalogItemId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
            {state?.errors?.quantity && (
              <p className="text-sm text-destructive">{state.errors.quantity[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Reason for transfer"
            />
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Transferring..." : "Transfer Stock"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
