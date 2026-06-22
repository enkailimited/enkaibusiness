"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createRoleAction, updateRoleAction } from "../actions";
import { ROLE_SCOPES, ROLE_SCOPE_LABELS } from "../constants";
import type { RoleWithPermissions } from "../types";

interface RoleFormProps {
  role?: RoleWithPermissions;
}

export function RoleForm({ role }: RoleFormProps) {
  const action = role ? updateRoleAction.bind(null, role.id) : createRoleAction;
  const [state, formAction, pending] = useActionState<Record<string, unknown> | null, FormData>(action as unknown as (prevState: Record<string, unknown> | null, formData: FormData) => Promise<Record<string, unknown> | null>, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{role ? "Edit Role" : "Create Role"}</CardTitle>
        <CardDescription>{role ? "Update role details" : "Define a new role with specific permissions"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction as unknown as (formData: FormData) => void} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" name="name" defaultValue={role?.name} placeholder="e.g. Store Manager" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={role?.slug} placeholder="e.g. store-manager" required pattern="^[a-z0-9-]+$" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="description" name="description" defaultValue={role?.description || ""} placeholder="Optional description" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <select id="scope" name="scope" defaultValue={role?.scope || "BUSINESS"} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required>
              {ROLE_SCOPES.map((s) => (
                <option key={s} value={s}>{ROLE_SCOPE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          {state && typeof state === "object" && "message" in state && typeof state.message === "string" && !("success" in state && state.success) && (
            <p className="text-sm text-destructive">{(state as Record<string, string>).message}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : role ? "Update Role" : "Create Role"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
