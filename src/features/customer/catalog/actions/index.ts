"use server";

import { cookies } from "next/headers";
import { addToCart, parseCart, serializeCart } from "../../cart/cart-service";

export async function addToCartAction(_prev: unknown, formData: FormData) {
  const catalogItemId = formData.get("catalogItemId") as string;
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity")) || 1;
  const imageUrl = (formData.get("imageUrl") as string) || null;
  const businessSlug = formData.get("businessSlug") as string;

  if (!catalogItemId || !name || !price) {
    return { success: false, message: "Invalid item" };
  }

  const cookieStore = await cookies();
  const existing = parseCart(cookieStore.get(`cart_${businessSlug}`)?.value);
  const updated = addToCart(existing, { catalogItemId, name, slug, price, quantity, imageUrl });
  cookieStore.set(`cart_${businessSlug}`, serializeCart(updated), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return { success: true, message: `Added ${name} to cart` };
}
