"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createPlanAction } from "../actions";
import { SUBSCRIPTION_INTERVALS } from "../constants";
import type { SubscriptionPlan } from "@prisma/client";

interface PlanFormProps {
  plan?: SubscriptionPlan;
}

export function PlanForm({ plan }: PlanFormProps) {
  const [state, formAction, pending] = useActionState(
    createPlanAction,
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan ? "Edit Plan" : "Create Plan"}</CardTitle>
        <CardDescription>
          {plan
            ? "Update subscription plan details"
            : "Define a new subscription plan"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={plan?.name}
              placeholder="e.g. Basic Plan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={plan?.slug}
              placeholder="e.g. basic-plan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="description"
              name="description"
              defaultValue={plan?.description ?? ""}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={plan ? Number(plan.amount) : ""}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={plan?.currency ?? "TZS"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Interval</Label>
              <select
                id="interval"
                name="interval"
                defaultValue={plan?.interval ?? "MONTHLY"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
              >
                {SUBSCRIPTION_INTERVALS.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
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
            {pending ? "Saving..." : plan ? "Update Plan" : "Create Plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
