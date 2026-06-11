"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupplierAction } from "../actions";
import { SUPPLIER_TYPES, PAYMENT_TERMS, COUNTRIES, CURRENCIES } from "../constants";

interface SupplierFormProps {
  businessId: string;
}

export function SupplierForm({ businessId }: SupplierFormProps) {
  const [state, formAction, pending] = useActionState(createSupplierAction.bind(null, businessId), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Supplier</CardTitle>
        <CardDescription>Add a new supplier to your business</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Supplier Name</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierType">Supplier Type</Label>
            <select
              id="supplierType"
              name="supplierType"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {SUPPLIER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                name="country"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                name="currency"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID</Label>
            <Input id="taxId" name="taxId" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <select
              id="paymentTerms"
              name="paymentTerms"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">Select payment terms</option>
              {PAYMENT_TERMS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
            <Label htmlFor="isActive">Active</Label>
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
            {pending ? "Creating..." : "Create Supplier"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
