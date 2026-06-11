"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { openSessionAction } from "../actions";

interface SessionOpenFormProps {
  businessId: string;
  stores: Array<{ id: string; name: string }>;
}

export function SessionOpenForm({ businessId, stores }: SessionOpenFormProps) {
  const [state, formAction, pending] = useActionState(openSessionAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open POS Session</CardTitle>
        <CardDescription>Open a new till session for the day</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeId">Store</Label>
            <select
              id="storeId"
              name="storeId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">No store</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openingFloat">Opening Float</Label>
            <Input
              id="openingFloat"
              name="openingFloat"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              required
            />
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
            {pending ? "Opening..." : "Open Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
