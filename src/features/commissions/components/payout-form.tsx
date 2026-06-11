"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPayoutAction } from "../actions";
import type { PendingPayout } from "../types";

interface PayoutFormProps {
  pendingPayouts: PendingPayout[];
}

export function PayoutForm({ pendingPayouts }: PayoutFormProps) {
  const [state, formAction, pending] = useActionState(createPayoutAction, null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const totalAmount = pendingPayouts
    .filter((p) => selectedEntries.some((e) => p.entries.some((pe) => pe.id === e)))
    .reduce((sum, p) => sum + p.total, 0);

  const allEntryIds = pendingPayouts.flatMap((p) => p.entries.map((e) => e.id));

  const toggleAll = () => {
    setSelectedEntries(selectedEntries.length === allEntryIds.length ? [] : [...allEntryIds]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Payout</CardTitle>
        <CardDescription>Select approved commission entries to pay out</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="entries" value={JSON.stringify(selectedEntries)} />
          <input type="hidden" name="amount" value={totalAmount} />

          {pendingPayouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending payouts available.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedEntries.length === allEntryIds.length && allEntryIds.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Select All</span>
              </div>

              {pendingPayouts.map((payout) => (
                <div key={payout.salesProfileId} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{payout.profileName}</span>
                    <span className="font-mono text-sm">${payout.total.toFixed(2)}</span>
                  </div>
                  {payout.entries.map((entry) => (
                    <label key={entry.id} className="flex items-center gap-2 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEntries([...selectedEntries, entry.id]);
                          } else {
                            setSelectedEntries(selectedEntries.filter((id) => id !== entry.id));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-muted-foreground">
                        ${entry.amount.toFixed(2)} — {entry.description ?? `Commission (${entry.type})`}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" />
          </div>

          <div className="text-sm font-medium">
            Total: ${totalAmount.toFixed(2)}
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

          <Button type="submit" disabled={pending || selectedEntries.length === 0}>
            {pending ? "Processing..." : `Process Payout (${selectedEntries.length} entries)`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
