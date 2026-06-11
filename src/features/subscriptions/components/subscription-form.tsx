"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { subscribeAction } from "../actions";

interface SubscriptionFormProps {
  plans: Array<{ id: string; name: string; amount: number; interval: string }>;
  businesses: Array<{ id: string; name: string }>;
}

export function SubscriptionForm({
  plans,
  businesses,
}: SubscriptionFormProps) {
  const [state, formAction, pending] = useActionState(
    subscribeAction,
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscribe Business</CardTitle>
        <CardDescription>
          Subscribe a business to a plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessId">Business</Label>
            <select
              id="businessId"
              name="businessId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
            >
              <option value="">Select business</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="planId">Plan</Label>
            <select
              id="planId"
              name="planId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
            >
              <option value="">Select plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {state?.errors && (
            <div className="text-sm text-destructive space-y-1">
              {Object.entries(state.errors).map(([field, msgs]) => (
                <p key={field}>
                  {field}: {msgs.join(", ")}
                </p>
              ))}
            </div>
          )}

          {state?.message && !state.errors && (
            <p
              className={
                state.success
                  ? "text-sm text-green-600"
                  : "text-sm text-destructive"
              }
            >
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
