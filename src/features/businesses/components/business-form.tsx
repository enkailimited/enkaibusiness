"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBusinessAction } from "../actions";
import { INDUSTRIES, INDUSTRY_LABELS, BUSINESS_MODES } from "../constants";

interface BusinessFormProps {
  workspaceId: string;
}

export function BusinessForm({ workspaceId }: BusinessFormProps) {
  const [state, formAction, pending] = useActionState(createBusinessAction.bind(null, workspaceId), null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("COMMERCE");
  const [selectedModes, setSelectedModes] = useState<string[]>([]);

  const availableModes = BUSINESS_MODES[selectedIndustry] ?? [];

  const toggleMode = (mode: string) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Business</CardTitle>
        <CardDescription>Add a new business to your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="modes" value={JSON.stringify(selectedModes)} />

          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID</Label>
            <Input id="taxId" name="taxId" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <select
              id="industry"
              name="industry"
              value={selectedIndustry}
              onChange={(e) => {
                setSelectedIndustry(e.target.value);
                setSelectedModes([]);
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {INDUSTRY_LABELS[ind]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Modes</Label>
            <div className="flex flex-wrap gap-2">
              {availableModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-sm border transition-colors ${
                    selectedModes.includes(mode)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input hover:bg-accent"
                  }`}
                >
                  {mode}
                </button>
              ))}
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
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Business"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
