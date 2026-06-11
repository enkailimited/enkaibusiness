"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createAccountAction } from "../actions";
import { ACCOUNT_STATUSES } from "../constants";
import type { Customer } from "@/features/customers/types";

interface AccountFormProps {
  businessId: string;
  customers: Customer[];
}

export function AccountForm({ businessId, customers }: AccountFormProps) {
  const [state, formAction, pending] = useActionState(createAccountAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Credit Account</CardTitle>
        <CardDescription>Set up a credit account for a customer</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer</Label>
            <select
              id="customerId"
              name="customerId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName}{c.lastName ? ` ${c.lastName}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="creditLimit">Credit Limit</Label>
            <Input id="creditLimit" name="creditLimit" type="number" min="0" step="0.01" defaultValue="0" />
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
            {pending ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
