"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createStaffAction, updateStaffAction } from "../actions";
import type { StaffWithUser } from "../types";

interface StaffFormProps {
  businessId: string;
  staff?: StaffWithUser;
  onSuccess?: () => void;
}

export function StaffForm({ businessId, staff, onSuccess }: StaffFormProps) {
  const action = staff ? updateStaffAction.bind(null, staff.id) : createStaffAction;
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{staff ? "Edit Staff" : "Add Staff"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {!staff && (
            <>
              <input type="hidden" name="businessId" value={businessId} />
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  name="userId"
                  placeholder="Select a user..."
                  required
                />
                {state?.errors?.userId && (
                  <p className="text-sm text-destructive">{state.errors.userId[0]}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="employeeCode">Employee Code</Label>
            <Input
              id="employeeCode"
              name="employeeCode"
              defaultValue={staff?.employeeCode ?? ""}
              placeholder="EMP-001"
            />
            {state?.errors?.employeeCode && (
              <p className="text-sm text-destructive">{state.errors.employeeCode[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              name="position"
              defaultValue={staff?.position ?? ""}
              placeholder="Cashier"
            />
            {state?.errors?.position && (
              <p className="text-sm text-destructive">{state.errors.position[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              name="hireDate"
              type="date"
              defaultValue={staff?.hireDate ? new Date(staff.hireDate).toISOString().split("T")[0] : ""}
            />
            {state?.errors?.hireDate && (
              <p className="text-sm text-destructive">{state.errors.hireDate[0]}</p>
            )}
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving..." : staff ? "Update Staff" : "Add Staff"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
