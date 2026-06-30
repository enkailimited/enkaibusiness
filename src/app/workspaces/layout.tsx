import { prisma } from "@/server/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import type { ReactNode } from "react";

export default async function WorkspacesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const [workspaceMember, staffProfile] = await Promise.all([
    prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { role: true },
    }),
    prisma.staff.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { businessId: true },
    }),
  ]);

  const isOwner = workspaceMember?.role === "OWNER" || workspaceMember?.role === "ADMIN";
  if (!isOwner && staffProfile) {
    redirect(`/workspaces/businesses/${staffProfile.businessId}/commerce/overview`);
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex flex-1 flex-col transition-all duration-300">
        <Navbar profileHref="/workspaces/profile" />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="max-w-8xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
