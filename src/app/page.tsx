import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";

export default async function RootPage() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          userRoles: {
            select: {
              role: { select: { slug: true, scope: true } },
              businessId: true,
            },
          },
        },
      });

      const hasPlatformRole = dbUser?.userRoles?.some(
        (ur) => ur.role.scope === "PLATFORM",
      );

      if (hasPlatformRole) {
        redirect("/platform/dashboard");
      }

      redirect("/workspaces/dashboard");
    }
  } catch {
    // not authenticated
  }

  redirect("/login");
}
