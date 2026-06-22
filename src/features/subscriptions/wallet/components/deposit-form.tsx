"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { recordDepositAction } from "../actions";

interface DepositFormProps {
  businessId: string;
}

export function DepositForm({ businessId }: DepositFormProps) {
  const [state, formAction, pending] = useActionState(
    recordDepositAction.bind(null, businessId),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Funds</CardTitle>
        <CardDescription>Deposit funds to subscription wallet</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              name="reference"
              placeholder="Payment reference (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="description"
              name="description"
              placeholder="Optional description"
            />
          </div>

          {state?.errors && (
            <div className="text-sm text-destructive space-y-1">
              {Object.entries(state.errors).map(([field, msgs]) => (
                <p key={field}>
                  {field}: {msgs.join(", ")}
                </p>
              ))}
            </div>
          )}

          {state?.message && !state.errors && (
            <p
              className={
                state.success
                  ? "text-sm text-green-600"
                  : "text-sm text-destructive"
              }
            >
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Processing..." : "Deposit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
