"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createRoleAction, updateRoleAction } from "../actions";
import type { ActionResponse } from "@/types/relationships";

interface RoleFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    scope: "PLATFORM" | "BUSINESS";
  };
}

export function RoleForm({ mode, initialData }: RoleFormProps) {
  const action = mode === "create" ? createRoleAction : updateRoleAction.bind(null, initialData?.id ?? "");
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Role" : "Edit Role"}</CardTitle>
        <CardDescription>
          {mode === "create" ? "Add a new role to the system" : "Update role details"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name}
              placeholder="e.g. Inventory Manager"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={initialData?.slug}
              placeholder="e.g. inventory-manager"
              pattern="^[a-z0-9-]+$"
              required
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <select
              id="scope"
              name="scope"
              defaultValue={initialData?.scope ?? "BUSINESS"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              required
            >
              <option value="PLATFORM">Platform</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description ?? ""}
              placeholder="Optional description of this role"
              rows={3}
            />
          </div>

          {state?.errors && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {Object.values(state.errors).flat().join(", ")}
            </div>
          )}

          {state?.success === false && !state.errors && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : mode === "create" ? "Create Role" : "Update Role"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
