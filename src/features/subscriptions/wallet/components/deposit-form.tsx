"use client";

import { useActionState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { submitDepositRequestAction } from "../../wallet-deposits/actions";

interface DepositFormProps {
  businessId: string;
}

export function DepositForm({ businessId }: DepositFormProps) {
  const depositAction = useMemo(() => submitDepositRequestAction.bind(null, businessId), [businessId]);
  const [state, formAction, pending] = useActionState(depositAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Funds</CardTitle>
        <CardDescription>Submit a deposit request for approval</CardDescription>
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
              placeholder="M-Pesa / Bank transaction ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. M-Pesa payment"
            />
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <p className="font-medium">Pending Approval</p>
            <p className="mt-1">Your deposit will need to be reviewed and approved by the platform team before funds are added to your wallet.</p>
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

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Submitting..." : "Submit Deposit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
