"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLocationAction, updateLocationAction } from "../actions";
import type { LocationWithBalances } from "../types";

interface LocationFormProps {
  businessId: string;
  location?: LocationWithBalances;
  onSuccess?: () => void;
}

export function LocationForm({ businessId, location, onSuccess }: LocationFormProps) {
  const action = location ? updateLocationAction.bind(null, location.id) : createLocationAction;
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{location ? "Edit Location" : "Add Location"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />

          <div className="space-y-2">
            <Label htmlFor="name">Location Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={location?.name ?? ""}
              placeholder="Main Warehouse"
              required
            />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchId">Branch ID (optional)</Label>
            <Input
              id="branchId"
              name="branchId"
              defaultValue={location?.branchId ?? ""}
              placeholder="For branch-level locations"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeId">Store ID (optional)</Label>
            <Input
              id="storeId"
              name="storeId"
              defaultValue={location?.storeId ?? ""}
              placeholder="For store-level locations"
            />
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving..." : location ? "Update Location" : "Create Location"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
