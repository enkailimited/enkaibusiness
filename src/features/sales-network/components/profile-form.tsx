"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createProfileAction, updateProfileAction } from "../actions";
import type { HierarchyWithCount } from "../types";

interface ProfileFormProps {
  userId: string;
  hierarchies: HierarchyWithCount[];
  managers?: { id: string; name: string }[];
  initialData?: {
    phone?: string;
    photo?: string;
    region?: string;
    hierarchyId?: string;
    managerId?: string;
  };
}

export function ProfileForm({ userId, hierarchies, managers, initialData }: ProfileFormProps) {
  const isEdit = !!initialData;
  const action = isEdit ? updateProfileAction.bind(null, userId) : createProfileAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Profile" : "Create Profile"}</CardTitle>
        <CardDescription>{isEdit ? "Update sales profile details" : "Create a new sales profile"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={initialData?.phone ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input id="region" name="region" defaultValue={initialData?.region ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hierarchyId">Hierarchy Level</Label>
            <select
              id="hierarchyId"
              name="hierarchyId"
              defaultValue={initialData?.hierarchyId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">No level</option>
              {hierarchies.map((h) => (
                <option key={h.id} value={h.id}>{h.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="managerId">Manager</Label>
            <select
              id="managerId"
              name="managerId"
              defaultValue={initialData?.managerId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">No manager</option>
              {managers?.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
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
            {pending ? "Saving..." : isEdit ? "Update Profile" : "Create Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
