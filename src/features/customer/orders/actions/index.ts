"use server";

import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import { parseCart, serializeCart } from "../../cart/cart-service";
import { createSale } from "@/features/sales/services/sale-service";

export async function placeOrderAction(_prev: unknown, formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string;
    const workspaceId = formData.get("workspaceId") as string;
    const customerId = formData.get("customerId") as string;
    const businessSlug = formData.get("businessSlug") as string;
    const total = Number(formData.get("total"));
    const paymentType = (formData.get("paymentType") as string) || "cash";
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    if (!businessId || !workspaceId || !customerId) {
      return { success: false, message: "Missing required fields" };
    }

    // Get cart items from cookie
    const cookieStore = await cookies();
    const items = parseCart(cookieStore.get(`cart_${businessSlug}`)?.value);
    if (items.length === 0) {
      return { success: false, message: "Cart is empty" };
    }

    // Find or create an ERP Customer linked to this CustomerAccount
    let erpCustomer = await prisma.customer.findFirst({
      where: { businessId, userId: customerId },
    });

    if (!erpCustomer) {
      const account = await prisma.customerAccount.findUnique({
        where: { id: customerId },
      });
      if (!account) return { success: false, message: "Customer account not found" };

      erpCustomer = await prisma.customer.create({
        data: {
          businessId,
          firstName: account.firstName,
          lastName: account.lastName,
          email: email || account.email,
          phone: phone || account.phone,
          customerType: "RETAIL",
          userId: customerId,
          isActive: true,
        },
      });
    }

    // Find the business branch
    const branch = await prisma.branch.findFirst({
      where: { businessId, isHeadOffice: true },
    });
    if (!branch) return { success: false, message: "No branch configured for this business" };

    // Create the sale via the existing service
    const saleItems = items.map((item) => ({
      catalogItemId: item.catalogItemId,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: 0,
      subtotal: item.price * item.quantity,
    }));

    const saleData = {
      branchId: branch.id,
      customerId: erpCustomer.id,
      saleDate: new Date().toISOString(),
      status: "completed" as const,
      paymentType: paymentType as "cash" | "credit",
      amountPaid: paymentType === "cash" ? total : 0,
      discountTotal: 0,
      taxTotal: 0,
      notes: `Order from Customer App by ${erpCustomer.firstName}`,
      items: saleItems,
    };

    const result = await createSale(saleData, businessId, workspaceId);

    if (!result.success) {
      return { success: false, message: result.message || "Failed to create order" };
    }

    // Clear the cart
    cookieStore.set(`cart_${businessSlug}`, serializeCart([]), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0,
    });

    return {
      success: true,
      message: "Order placed successfully!",
      orderId: result.data?.id,
    };
  } catch (error) {
    console.error("Place order error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Failed to place order" };
  }
}
