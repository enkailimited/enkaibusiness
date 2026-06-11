"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createStoreAction } from "../actions";

interface StoreFormProps {
  branchId: string;
}

export function StoreForm({ branchId }: StoreFormProps) {
  const [state, formAction, pending] = useActionState(createStoreAction.bind(null, branchId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Store</CardTitle>
        <CardDescription>Add a new store to this branch</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Store Name</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" />
          </div>

          {state?.message && (
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Store"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
