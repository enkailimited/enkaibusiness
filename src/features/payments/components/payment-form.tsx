"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAYMENT_STATUSES, PAYMENT_METHOD_LABELS } from "../constants";
import { createPaymentAction } from "../actions";
import type { PaymentMethodWithCount } from "../types";

interface PaymentFormProps {
  businessId: string;
  paymentMethods: PaymentMethodWithCount[];
  defaultMethodId?: string;
  customerId?: string;
  onSuccess?: () => void;
  referenceType?: string;
  referenceId?: string;
}

export function PaymentForm({
  businessId,
  paymentMethods,
  defaultMethodId,
  customerId,
  onSuccess,
  referenceType,
  referenceId,
}: PaymentFormProps) {
  const [state, formAction, pending] = useActionState(createPaymentAction, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />
          {customerId && <input type="hidden" name="customerId" value={customerId} />}
          {referenceType && <input type="hidden" name={referenceType === "credit" ? "customerCreditTxId" : `${referenceType}Id`} value={referenceId ?? ""} />}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
            {state?.errors?.amount && (
              <p className="text-sm text-destructive">{state.errors.amount[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethodId">Payment Method</Label>
            <Select name="paymentMethodId" defaultValue={defaultMethodId}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({PAYMENT_METHOD_LABELS[m.type] ?? m.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.paymentMethodId && (
              <p className="text-sm text-destructive">{state.errors.paymentMethodId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="completed">
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              name="reference"
              placeholder="Receipt or transaction reference"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAt">Payment Date</Label>
            <Input
              id="paidAt"
              name="paidAt"
              type="datetime-local"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Optional notes"
            />
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
