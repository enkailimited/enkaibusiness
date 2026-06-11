import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { registerSchema } from "@/features/auth/schemas";
import { normalizePhone } from "@/lib/phone";
import type { ActionResponse } from "@/types/relationships";

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<ActionResponse> {
  const parsed = registerSchema.safeParse({
    ...input,
    confirmPassword: input.password,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password, firstName, lastName, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { success: false, message: "An account with this email already exists" };
  }

  if (phone) {
    const phoneUser = await prisma.user.findUnique({ where: { phone: normalizePhone(phone) || phone }, select: { id: true } });
    if (phoneUser) {
      return { success: false, message: "This phone number is already registered" };
    }
  }

  try {
    const response = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: `${firstName} ${lastName}`,
      },
      headers: await headers(),
    } as Parameters<typeof auth.api.signUpEmail>[0]);

    if (!response?.user) {
      return { success: false, message: "Registration failed. No user created." };
    }

    return {
      success: true,
      message: "Account created successfully",
      data: { userId: response.user.id, email: response.user.email },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Registration failed";
    if (msg.toLowerCase().includes("already")) {
      return { success: false, message: "An account with this email already exists" };
    }
    return { success: false, message: msg };
  }
}
