import { cookies } from "next/headers";
import { parseCart, updateQuantity, serializeCart } from "@/features/customer/cart/cart-service";

export async function POST(request: Request) {
  const formData = await request.formData();
  const catalogItemId = formData.get("catalogItemId") as string;
  const quantity = Number(formData.get("quantity"));
  const businessSlug = formData.get("businessSlug") as string;

  const cookieStore = await cookies();
  const existing = parseCart(cookieStore.get(`cart_${businessSlug}`)?.value);
  const updated = updateQuantity(existing, catalogItemId, quantity);
  cookieStore.set(`cart_${businessSlug}`, serializeCart(updated), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60,
  });

  return Response.json({ success: true });
}
