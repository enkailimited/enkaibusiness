"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createExpenseAction } from "../actions";
import type { ExpenseCategory } from "@/features/expense-categories/types";

interface ExpenseFormProps {
  businessId: string;
  categories: ExpenseCategory[];
}

export function ExpenseForm({ businessId, categories }: ExpenseFormProps) {
  const [state, formAction, pending] = useActionState(createExpenseAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Expense</CardTitle>
        <CardDescription>Record a new business expense</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenseDate">Date</Label>
            <Input id="expenseDate" name="expenseDate" type="date" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidTo">Paid To</Label>
            <Input id="paidTo" name="paidTo" placeholder="Vendor or recipient name" />
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
            {pending ? "Creating..." : "Create Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
