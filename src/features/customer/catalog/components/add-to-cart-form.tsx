"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Loader2 } from "lucide-react";
import { addToCartAction } from "@/features/customer/catalog/actions";

interface AddToCartFormProps {
  item: {
    id: string;
    name: string;
    slug: string;
    price: { toString(): string };
    imageUrl?: string | null;
  };
  businessSlug: string;
}

export function AddToCartForm({ item, businessSlug }: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [state, action, pending] = useActionState(addToCartAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="catalogItemId" value={item.id} />
      <input type="hidden" name="name" value={item.name} />
      <input type="hidden" name="slug" value={item.slug} />
      <input type="hidden" name="price" value={Number(item.price)} />
      <input type="hidden" name="imageUrl" value={item.imageUrl || ""} />
      <input type="hidden" name="businessSlug" value={businessSlug} />

      <div className="flex items-center gap-2">
        <label className="text-sm">Quantity:</label>
        <Input
          type="number"
          name="quantity"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-20"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
          Add to Cart
        </Button>
        <Link href={`/customer/cart?business=${businessSlug}`}>
          <Button type="button" variant="outline">View Cart</Button>
        </Link>
      </div>

      {state?.message && (
        <p className={`text-sm ${state.success ? "text-green-600" : "text-destructive"}`}>{state.message}</p>
      )}
    </form>
  );
}
