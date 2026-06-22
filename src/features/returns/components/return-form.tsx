"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createReturnAction } from "../actions";
import { RETURN_CONDITIONS, REFUND_METHODS } from "../constants";

interface ReturnFormProps {
  businessId: string;
}

export function ReturnForm({ businessId }: ReturnFormProps) {
  const [state, formAction, pending] = useActionState(createReturnAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Return</CardTitle>
        <CardDescription>Process a return for a sale</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="saleId">Sale ID</Label>
            <Input id="saleId" name="saleId" placeholder="Sale ID" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Return</Label>
            <textarea
              id="reason"
              name="reason"
              required
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="refundAmount">Refund Amount</Label>
              <Input id="refundAmount" name="refundAmount" type="number" step="0.01" min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundMethod">Refund Method</Label>
              <select
                id="refundMethod"
                name="refundMethod"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select method</option>
                {REFUND_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <textarea
              id="notes"
              name="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Return Items</Label>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input name="items[0][catalogItemId]" placeholder="Catalog item ID" />
              </div>
              <div className="w-20">
                <Input name="items[0][quantity]" type="number" step="0.01" min="0.01" placeholder="Qty" />
              </div>
              <div className="w-24">
                <Input name="items[0][unitPrice]" type="number" step="0.01" min="0" placeholder="Price" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input name="items[0][reason]" placeholder="Return reason" />
              </div>
              <select
                name="items[0][condition]"
                className="flex h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Condition</option>
                {RETURN_CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
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
            {pending ? "Creating..." : "Create Return"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
