"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { placeOrderAction } from "@/features/customer/orders/actions";

interface CheckoutFormProps {
  businessId: string;
  workspaceId: string;
  businessSlug: string;
  customerId: string;
  total: number;
}

export function CheckoutForm({ businessId, workspaceId, businessSlug, customerId, total }: CheckoutFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrderAction, null);

  if (state?.success) {
    router.push(`/customer/orders/${state.orderId}?business=${businessSlug}`);
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="businessSlug" value={businessSlug} />
      <input type="hidden" name="total" value={total} />

      {state?.message && !state?.success && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{state.message}</p>
      )}

      <h2 className="text-lg font-semibold">Contact Information</h2>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="your@email.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" type="tel" placeholder="255700000001" />
      </div>

      <h2 className="text-lg font-semibold pt-4">Payment</h2>
      <div className="space-y-2">
        <Label htmlFor="paymentType">Payment Method</Label>
        <select
          id="paymentType"
          name="paymentType"
          className="w-full border rounded-md p-2 bg-background"
          defaultValue="cash"
        >
          <option value="cash">Cash on Delivery</option>
          <option value="credit">Credit</option>
        </select>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Place Order — {total.toLocaleString()} TZS
      </Button>
    </form>
  );
}
