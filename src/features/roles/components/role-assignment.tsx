"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { assignRoleToUserAction, removeRoleFromUserAction } from "../actions";
import type { ActionResponse } from "@/types/relationships";

interface RoleAssignmentProps {
  userId: string;
  businessId?: string;
  assignedRoleIds: string[];
  availableRoles: Array<{ id: string; name: string; slug: string; scope: string }>;
}

export function RoleAssignment({ userId, businessId, assignedRoleIds, availableRoles }: RoleAssignmentProps) {
  const [assignState, assignAction, assignPending] = useActionState<ActionResponse | null, FormData>(
    assignRoleToUserAction,
    null,
  );

  const [removeState, removeAction, removePending] = useActionState<ActionResponse | null, FormData>(
    removeRoleFromUserAction,
    null,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign Role</CardTitle>
          <CardDescription>Assign a new role to this user</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={assignAction} className="flex items-end gap-3">
            <input type="hidden" name="userId" value={userId} />
            {businessId && <input type="hidden" name="businessId" value={businessId} />}
            <div className="flex-1 space-y-2">
              <label htmlFor="roleId" className="text-sm font-medium">
                Role
              </label>
              <select
                id="roleId"
                name="roleId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                required
              >
                <option value="">Select a role...</option>
                {availableRoles
                  .filter((r) => !assignedRoleIds.includes(r.id))
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.scope})
                    </option>
                  ))}
              </select>
            </div>
            <Button type="submit" disabled={assignPending}>
              {assignPending ? "Assigning..." : "Assign"}
            </Button>
          </form>

          {assignState?.success === false && (
            <p className="mt-2 text-sm text-destructive">{assignState.message}</p>
          )}
          {assignState?.success === true && (
            <p className="mt-2 text-sm text-green-600">{assignState.message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remove Role</CardTitle>
          <CardDescription>Remove a role from this user</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={removeAction} className="flex items-end gap-3">
            <input type="hidden" name="userId" value={userId} />
            {businessId && <input type="hidden" name="businessId" value={businessId} />}
            <div className="flex-1 space-y-2">
              <label htmlFor="removeRoleId" className="text-sm font-medium">
                Role
              </label>
              <select
                id="removeRoleId"
                name="roleId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                required
              >
                <option value="">Select a role...</option>
                {availableRoles
                  .filter((r) => assignedRoleIds.includes(r.id))
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
              </select>
            </div>
            <Button type="submit" variant="destructive" disabled={removePending}>
              {removePending ? "Removing..." : "Remove"}
            </Button>
          </form>

          {removeState?.success === false && (
            <p className="mt-2 text-sm text-destructive">{removeState.message}</p>
          )}
          {removeState?.success === true && (
            <p className="mt-2 text-sm text-green-600">{removeState.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
