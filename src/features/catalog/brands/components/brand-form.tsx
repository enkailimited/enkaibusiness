"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createBrandAction, updateBrandAction } from "../actions";
import type { ActionResponse } from "@/types/relationships";

interface BrandFormProps {
  mode: "create" | "edit";
  businessId: string;
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
  };
}

export function BrandForm({ mode, businessId, initialData }: BrandFormProps) {
  const action = mode === "create"
    ? createBrandAction.bind(null, businessId)
    : updateBrandAction.bind(null, initialData?.id ?? "");
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Brand" : "Edit Brand"}</CardTitle>
        <CardDescription>
          {mode === "create" ? "Add a new brand" : "Update brand details"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name}
              placeholder="e.g. Nestlé"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description ?? ""}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              defaultValue={initialData?.logoUrl ?? ""}
              placeholder="https://example.com/logo.png"
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
            {pending ? "Saving..." : mode === "create" ? "Create Brand" : "Update Brand"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
