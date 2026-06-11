"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { recordTransactionAction } from "../actions";
import { formatCurrency } from "@/lib/utils";
import type { CreditAccountWithCustomer } from "../types";

interface PaymentFormProps {
  businessId: string;
  account: CreditAccountWithCustomer;
}

export function PaymentForm({ businessId, account }: PaymentFormProps) {
  const [state, formAction, pending] = useActionState(recordTransactionAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
        <CardDescription>
          {account.customer.firstName}{account.customer.lastName ? ` ${account.customer.lastName}` : ""}
          {" — "}Current Balance: {formatCurrency(account.currentBalance)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="accountId" value={account.id} />
          <input type="hidden" name="type" value="payment" />

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Payment received" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" name="reference" placeholder="Receipt or transaction ID" />
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
            {pending ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
