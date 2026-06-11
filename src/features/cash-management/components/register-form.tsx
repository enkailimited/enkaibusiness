"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createRegisterAction } from "../actions";
import { REGISTER_TYPES } from "../constants";

interface RegisterFormProps {
  businessId: string;
}

export function RegisterForm({ businessId }: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(createRegisterAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Cash Register</CardTitle>
        <CardDescription>Add a new cash register for your business</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="e.g. Main Counter" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Select type</option>
              {REGISTER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingBalance">Opening Balance</Label>
            <Input id="openingBalance" name="openingBalance" type="number" step="0.01" min="0" defaultValue="0" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" placeholder="TZS" defaultValue="TZS" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branchId">Branch ID (optional)</Label>
            <Input id="branchId" name="branchId" placeholder="Branch UUID" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeId">Store ID (optional)</Label>
            <Input id="storeId" name="storeId" placeholder="Store UUID" />
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
            {pending ? "Creating..." : "Create Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
