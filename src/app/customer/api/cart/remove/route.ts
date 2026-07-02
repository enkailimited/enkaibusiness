import { cookies } from "next/headers";
import { parseCart, removeFromCart, serializeCart } from "@/features/customer/cart/cart-service";

export async function POST(request: Request) {
  const formData = await request.formData();
  const catalogItemId = formData.get("catalogItemId") as string;
  const businessSlug = formData.get("businessSlug") as string;

  const cookieStore = await cookies();
  const existing = parseCart(cookieStore.get(`cart_${businessSlug}`)?.value);
  const updated = removeFromCart(existing, catalogItemId);
  cookieStore.set(`cart_${businessSlug}`, serializeCart(updated), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60,
  });

  return Response.json({ success: true });
}
