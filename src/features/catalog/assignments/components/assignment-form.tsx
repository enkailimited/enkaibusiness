"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ASSIGNMENT_LEVEL_LABELS } from "../constants";
import { createAssignmentAction } from "../actions";

interface AssignmentFormProps {
  businessId: string;
  catalogItemId: string;
  onSuccess?: () => void;
}

export function AssignmentForm({ businessId, catalogItemId, onSuccess }: AssignmentFormProps) {
  const [state, formAction, pending] = useActionState(createAssignmentAction, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="catalogItemId" value={catalogItemId} />

          <div className="space-y-2">
            <Label htmlFor="branchId">Branch ID (optional)</Label>
            <Input
              id="branchId"
              name="branchId"
              placeholder={`${ASSIGNMENT_LEVEL_LABELS.branch} UUID`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeId">Store ID (optional)</Label>
            <Input
              id="storeId"
              name="storeId"
              placeholder={`${ASSIGNMENT_LEVEL_LABELS.store} UUID`}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isAvailable"
              name="isAvailable"
              defaultChecked={true}
              value="true"
            />
            <Label htmlFor="isAvailable">Available at this location</Label>
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Adding..." : "Add Assignment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
