"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { recordTransactionAction } from "../actions";

interface CashInFormProps {
  businessId: string;
  registerId: string;
}

export function CashInForm({ businessId, registerId }: CashInFormProps) {
  const [state, formAction, pending] = useActionState(recordTransactionAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash In</CardTitle>
        <CardDescription>Record money coming into this register</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="registerId" value={registerId} />
          <input type="hidden" name="type" value="cash_in" />

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference (optional)</Label>
            <Input id="reference" name="reference" placeholder="e.g. INV-001" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              name="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              placeholder="Reason for cash in"
            />
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
            {pending ? "Recording..." : "Record Cash In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
