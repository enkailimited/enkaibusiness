"use server";

import { cookies } from "next/headers";
import { registerCustomer, loginCustomer, getCustomerProfile } from "../service/customer-auth";

const COOKIE_OPTIONS = {
  name: "customer_token",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

export async function registerAction(_prev: unknown, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    if (!email || !firstName || !password) {
      return { success: false, message: "Email, first name, and password are required" };
    }

    const result = await registerCustomer({ email, firstName, lastName, phone, password });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_OPTIONS.name, result.token, COOKIE_OPTIONS);

    return { success: true, message: "Registration successful", customerId: result.customerId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Registration failed" };
  }
}

export async function loginAction(_prev: unknown, formData: FormData) {
  try {
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    if (!identifier || !password) {
      return { success: false, message: "Email/phone and password are required" };
    }

    const result = await loginCustomer(identifier, password);
    if (!result) {
      return { success: false, message: "Invalid credentials" };
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_OPTIONS.name, result.token, COOKIE_OPTIONS);

    return { success: true, message: "Login successful", customerId: result.customerId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Login failed" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_OPTIONS.name);
  return { success: true };
}

export async function getCustomerAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_OPTIONS.name)?.value;
  if (!token) return null;

  const { verifyCustomerJWT } = await import("../service/customer-auth");
  const payload = await verifyCustomerJWT(token);
  if (!payload?.sub) return null;

  return getCustomerProfile(payload.sub);
}
