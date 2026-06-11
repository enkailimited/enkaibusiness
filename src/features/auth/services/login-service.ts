import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { normalizePhone } from "@/lib/phone";
import { loginSchema } from "@/features/auth/schemas";
import type { ActionResponse } from "@/types/relationships";

async function resolveIdentifier(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) return identifier;
  const normalized = normalizePhone(identifier) || identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: normalized, mode: "insensitive" } },
        { phone: normalized },
      ],
    },
    select: { email: true },
  });
  return user?.email || null;
}

export async function login(
  identifier: string,
  password: string,
  rememberMe = true,
): Promise<ActionResponse<{ userId: string; email: string; isOnboarded: boolean }>> {
  const parsed = loginSchema.safeParse({ identifier, password });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const email = await resolveIdentifier(identifier);
  if (!email) {
    return { success: false, message: "Invalid email, phone/username, or password" };
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email, password, rememberMe },
      headers: await headers(),
    });

    if (!response?.user) {
      return { success: false, message: "Authentication failed. No session created." };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: response.user.id },
      select: { isOnboarded: true },
    });

    return {
      success: true,
      message: "Signed in successfully",
      data: {
        userId: response.user.id,
        email: response.user.email,
        isOnboarded: dbUser?.isOnboarded ?? false,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "An error occurred during sign in";
    if (
      msg.toLowerCase().includes("invalid") ||
      msg.toLowerCase().includes("no user") ||
      msg.toLowerCase().includes("incorrect")
    ) {
      return { success: false, message: "Invalid email, phone/username, or password" };
    }
    return { success: false, message: msg };
  }
}

export async function loginWithEmail(
  email: string,
  password: string,
  rememberMe = true,
): Promise<ActionResponse<{ userId: string; email: string }>> {
  try {
    const response = await auth.api.signInEmail({
      body: { email, password, rememberMe },
      headers: await headers(),
    });

    if (!response?.user) {
      return { success: false, message: "Authentication failed." };
    }

    return {
      success: true,
      message: "Signed in successfully",
      data: { userId: response.user.id, email: response.user.email },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Sign in failed";
    return { success: false, message: msg };
  }
}
