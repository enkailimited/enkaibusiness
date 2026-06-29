import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";

interface CreateAuthUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
}

export async function createAuthUser(input: CreateAuthUserInput): Promise<{ userId: string } | null> {
  const hdrs = await headers();
  const res = await auth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name: `${input.firstName} ${input.lastName}`,
      firstName: input.firstName,
      lastName: input.lastName,
      gender: input.gender ?? null,
    },
    headers: hdrs,
  } as any);

  if (!res || (res as any).error) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return null;

  return { userId: user.id };
}
