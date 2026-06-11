"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoiceAction } from "../actions";
import type { Customer } from "@/features/customers/types";

interface InvoiceFormProps {
  businessId: string;
  customers: Customer[];
}

export function InvoiceForm({ businessId, customers }: InvoiceFormProps) {
  const [state, formAction, pending] = useActionState(createInvoiceAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Invoice</CardTitle>
        <CardDescription>Generate a new invoice for a customer</CardDescription>
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
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName}{c.lastName ? ` ${c.lastName}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleId">Link to Sale (optional)</Label>
            <Input id="saleId" name="saleId" placeholder="Sale ID" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Items</Label>
            <div id="items-container" className="space-y-2">
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
            {pending ? "Creating..." : "Create Invoice"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
