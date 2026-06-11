import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import { normalizePhone } from "@/lib/phone";
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

export async function signIn(input: LoginInput) {
  const email = await resolveIdentifier(input.identifier);
  if (!email) throw new Error("Invalid credentials");
  return auth.api.signInEmail({
    body: { email, password: input.password, rememberMe: true },
    headers: await headers(),
  } as Parameters<typeof auth.api.signInEmail>[0]);
}

export async function signUp(input: RegisterInput) {
  return auth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name: `${input.firstName} ${input.lastName}`,
    },
    headers: await headers(),
  } as Parameters<typeof auth.api.signUpEmail>[0]);
}

export async function signOut() {
  return auth.api.signOut({
    headers: await headers(),
  } as Parameters<typeof auth.api.signOut>[0]);
}

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  } as Parameters<typeof auth.api.getSession>[0]);
}
