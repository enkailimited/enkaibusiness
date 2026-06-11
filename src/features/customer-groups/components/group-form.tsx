"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createGroupAction } from "../actions";

interface GroupFormProps {
  businessId: string;
}

export function GroupForm({ businessId }: GroupFormProps) {
  const [state, formAction, pending] = useActionState(createGroupAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Customer Group</CardTitle>
        <CardDescription>Add a new group to categorize customers</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountPercent">Discount (%)</Label>
            <Input id="discountPercent" name="discountPercent" type="number" min="0" max="100" step="0.01" defaultValue="0" />
          </div>

          <div className="flex items-center gap-2">
            <input id="isDefault" name="isDefault" type="checkbox" className="h-4 w-4" />
            <Label htmlFor="isDefault">Set as default group</Label>
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
            {pending ? "Creating..." : "Create Group"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
