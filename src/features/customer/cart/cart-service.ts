export interface CartItem {
  catalogItemId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

const CART_COOKIE = "customer_cart";

export function parseCart(cookieValue?: string | null): CartItem[] {
  if (!cookieValue) return [];
  try {
    return JSON.parse(cookieValue) as CartItem[];
  } catch {
    return [];
  }
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify(items);
}

export function addToCart(existing: CartItem[], item: CartItem): CartItem[] {
  const idx = existing.findIndex((i) => i.catalogItemId === item.catalogItemId);
  if (idx >= 0) {
    existing[idx].quantity += item.quantity;
    return [...existing];
  }
  return [...existing, item];
}

export function removeFromCart(existing: CartItem[], catalogItemId: string): CartItem[] {
  return existing.filter((i) => i.catalogItemId !== catalogItemId);
}

export function updateQuantity(existing: CartItem[], catalogItemId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeFromCart(existing, catalogItemId);
  const idx = existing.findIndex((i) => i.catalogItemId === catalogItemId);
  if (idx >= 0) {
    existing[idx].quantity = quantity;
    return [...existing];
  }
  return existing;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
