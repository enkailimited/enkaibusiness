"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCategoryAction } from "../actions";

interface CategoryFormProps {
  businessId: string;
}

export function CategoryForm({ businessId }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(createCategoryAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Expense Category</CardTitle>
        <CardDescription>Add a new category for expense tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Rent, Utilities" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              placeholder="Optional description"
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
            <Label htmlFor="isActive">Active</Label>
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
            {pending ? "Creating..." : "Create Category"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
