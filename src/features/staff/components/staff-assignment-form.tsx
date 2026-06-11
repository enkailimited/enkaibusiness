"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createStaffAssignmentAction, removeStaffAssignmentAction } from "../actions";
import type { StaffWithUser, StaffAssignmentWithDetails } from "../types";

interface StaffAssignmentFormProps {
  staff: StaffWithUser;
  businessId: string;
  assignments: StaffAssignmentWithDetails[];
  onSuccess?: () => void;
}

export function StaffAssignmentForm({ staff, businessId, assignments, onSuccess }: StaffAssignmentFormProps) {
  const [state, formAction, pending] = useActionState(createStaffAssignmentAction, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Assign {staff.user.firstName} {staff.user.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="staffId" value={staff.id} />
            <input type="hidden" name="businessId" value={businessId} />

            <div className="space-y-2">
              <Label htmlFor="level">Assignment Level</Label>
              <select
                id="level"
                name="level"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                <option value="">Select level...</option>
                <option value="business">Business</option>
                <option value="branch">Branch</option>
                <option value="store">Store</option>
              </select>
              {state?.errors?.level && (
                <p className="text-sm text-destructive">{state.errors.level[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchId">Branch ID (optional)</Label>
              <Input id="branchId" name="branchId" placeholder="Branch UUID" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeId">Store ID (optional)</Label>
              <Input id="storeId" name="storeId" placeholder="Store UUID" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleId">Role ID (optional)</Label>
              <Input id="roleId" name="roleId" placeholder="Role UUID" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPrimary" name="isPrimary" value="true" className="h-4 w-4" />
              <Label htmlFor="isPrimary">Primary assignment</Label>
            </div>

            {state?.message && !state?.success && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Assigning..." : "Create Assignment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium capitalize">{assignment.level}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.branch?.name && `Branch: ${assignment.branch.name}`}
                      {assignment.store?.name && ` | Store: ${assignment.store.name}`}
                      {assignment.role?.name && ` | Role: ${assignment.role.name}`}
                    </p>
                    {assignment.isPrimary && (
                      <span className="text-xs text-green-600 font-medium">Primary</span>
                    )}
                  </div>
                  <form
                    action={async () => {
                      await removeStaffAssignmentAction(assignment.id, businessId);
                      onSuccess?.();
                    }}
                  >
                    <Button type="submit" variant="destructive" size="sm">
                      Remove
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
