"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { loginSchema, registerSchema } from "@/features/auth/schemas";
import { prisma } from "@/server/db";
import { normalizePhone } from "@/lib/phone";
import type { ActionResponse } from "@/types/relationships";
import type { LoginInput, RegisterInput } from "@/features/auth/types";

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

export async function loginAction(input: LoginInput): Promise<ActionResponse> {
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const email = await resolveIdentifier(parsed.data.identifier);
    if (!email) {
      return { success: false, message: "Invalid email, phone/username, or password" };
    }

    await auth.api.signInEmail({
      body: { email, password: parsed.data.password, rememberMe: true },
      headers: await headers(),
    } as Parameters<typeof auth.api.signInEmail>[0]);

    return { success: true, message: "Signed in successfully" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "An error occurred during sign in";
    if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("no user")) {
      return { success: false, message: "Invalid email, phone/username, or password" };
    }
    return { success: false, message: msg };
  }
}

export async function registerAction(input: RegisterInput): Promise<ActionResponse> {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { email, password, firstName, lastName } = parsed.data;

    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: `${firstName} ${lastName}`,
      },
      headers: await headers(),
    } as Parameters<typeof auth.api.signUpEmail>[0]);

    return { success: true, message: "Account created successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred during registration",
    };
  }
}

export async function logoutAction(): Promise<ActionResponse> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    } as Parameters<typeof auth.api.signOut>[0]);
    return { success: true, message: "Signed out successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred during sign out",
    };
  }
}
