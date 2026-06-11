"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMenuItemAction } from "../actions";

interface MenuFormProps {
  businessId: string;
  qrCodeId: string;
}

export function MenuForm({ businessId, qrCodeId }: MenuFormProps) {
  const [state, formAction, pending] = useActionState(createMenuItemAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Menu Item</CardTitle>
        <CardDescription>Link a catalog item to this QR code</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="qrCodeId" value={qrCodeId} />

          <div className="space-y-2">
            <Label htmlFor="catalogItemId">Catalog Item ID</Label>
            <Input id="catalogItemId" name="catalogItemId" placeholder="Catalog item ID" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (override)</Label>
            <Input id="price" name="price" type="number" step="0.01" placeholder="Leave blank to use catalog price" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={0} />
          </div>

          {state?.message && (
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add to Menu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
