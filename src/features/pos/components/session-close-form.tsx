"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { closeSessionAction } from "../actions";

interface SessionCloseFormProps {
  businessId: string;
  sessionId: string;
  openingFloat: number;
}

export function SessionCloseForm({ businessId, sessionId, openingFloat }: SessionCloseFormProps) {
  const [state, formAction, pending] = useActionState(
    closeSessionAction.bind(null, sessionId, businessId),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Close POS Session</CardTitle>
        <CardDescription>Close the current till session</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">Opening Float</span>
          <p className="text-lg font-bold">
            {new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(openingFloat)}
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="closingFloat">Closing Float</Label>
            <Input
              id="closingFloat"
              name="closingFloat"
              type="number"
              step="0.01"
              min="0"
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

          <Button type="submit" disabled={pending} variant="destructive">
            {pending ? "Closing..." : "Close Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
