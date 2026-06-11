"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCommissionRuleAction, updateCommissionRuleAction } from "../actions";
import { COMMISSION_TYPE_OPTIONS } from "../constants";
import type { RuleWithHierarchy } from "../types";

interface RuleFormProps {
  hierarchies: { id: string; title: string }[];
  rule?: RuleWithHierarchy;
}

export function RuleForm({ hierarchies, rule }: RuleFormProps) {
  const isEdit = !!rule;
  const action = isEdit ? updateCommissionRuleAction.bind(null, rule.id) : createCommissionRuleAction;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Rule" : "Create Rule"}</CardTitle>
        <CardDescription>{isEdit ? "Update commission rule" : "Define a new commission rule"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input id="name" name="name" required defaultValue={rule?.name ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {COMMISSION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" min="0" step="0.01" defaultValue={rule ? Number(rule.value) : ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hierarchyLevelId">Hierarchy Level</Label>
            <select
              id="hierarchyLevelId"
              name="hierarchyLevelId"
              defaultValue={rule?.hierarchyLevelId ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">All Levels</option>
              {hierarchies.map((h) => (
                <option key={h.id} value={h.id}>{h.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount</Label>
              <Input id="minAmount" name="minAmount" type="number" min="0" step="0.01"
                defaultValue={rule?.minAmount ? Number(rule.minAmount) : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount</Label>
              <Input id="maxAmount" name="maxAmount" type="number" min="0" step="0.01"
                defaultValue={rule?.maxAmount ? Number(rule.maxAmount) : ""} />
            </div>
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
            {pending ? "Saving..." : isEdit ? "Update Rule" : "Create Rule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
