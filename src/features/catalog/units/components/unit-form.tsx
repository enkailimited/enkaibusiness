"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createUnitAction, updateUnitAction } from "../actions";
import { UNIT_TYPES, UNIT_TYPE_LABELS } from "../constants";
import type { ActionResponse } from "@/types/relationships";

interface UnitFormProps {
  mode: "create" | "edit";
  businessId: string;
  initialData?: {
    id: string;
    name: string;
    abbreviation: string;
    type: string;
    isBase: boolean;
  };
}

export function UnitForm({ mode, businessId, initialData }: UnitFormProps) {
  const action = mode === "create"
    ? createUnitAction.bind(null, businessId)
    : updateUnitAction.bind(null, initialData?.id ?? "");
  const [state, formAction, pending] = useActionState<ActionResponse | null, FormData>(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Unit" : "Edit Unit"}</CardTitle>
        <CardDescription>
          {mode === "create" ? "Add a new unit of measure" : "Update unit details"}
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
              placeholder="e.g. Kilogram"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="abbreviation">Abbreviation</Label>
            <Input
              id="abbreviation"
              name="abbreviation"
              defaultValue={initialData?.abbreviation}
              placeholder="e.g. kg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={initialData?.type ?? "count"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              required
            >
              {UNIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {UNIT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isBase"
              defaultChecked={initialData?.isBase ?? false}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">Base unit of measure</span>
          </label>

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
            {pending ? "Saving..." : mode === "create" ? "Create Unit" : "Update Unit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
