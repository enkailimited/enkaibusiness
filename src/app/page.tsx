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
          staffProfiles: {
            select: { id: true, businessId: true, isActive: true },
          },
        },
      });

      const hasPlatformRole = dbUser?.userRoles?.some(
        (ur) => ur.role.scope === "PLATFORM",
      );

      if (hasPlatformRole) {
        redirect("/platform/dashboard");
      }

      const workspaceMembership = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { role: true, workspaceId: true },
      });
      const isWorkspaceOwner = workspaceMembership?.role === "OWNER" || workspaceMembership?.role === "ADMIN";

      const activeStaffBusiness = dbUser?.staffProfiles?.find((s) => s.isActive)?.businessId;
      if (activeStaffBusiness) {
        const biz = await prisma.business.findUnique({
          where: { id: activeStaffBusiness },
          select: { status: true },
        });
        if (biz && biz.status !== "ACTIVE") {
          redirect(`/workspaces/businesses/${activeStaffBusiness}/activation`);
        }
        if (!isWorkspaceOwner) {
          redirect(`/workspaces/businesses/${activeStaffBusiness}/commerce/overview`);
        }
      }

      const roleBusinessId = dbUser?.userRoles?.find((ur) => ur.businessId)?.businessId;
      if (roleBusinessId) {
        const biz = await prisma.business.findUnique({
          where: { id: roleBusinessId },
          select: { status: true },
        });
        if (biz && biz.status !== "ACTIVE") {
          redirect(`/workspaces/businesses/${roleBusinessId}/activation`);
        }
        if (!isWorkspaceOwner) {
          redirect(`/workspaces/businesses/${roleBusinessId}/commerce/overview`);
        }
      }

      redirect("/workspaces/dashboard");
    }
  } catch {
    // not authenticated
  }

  redirect("/login");
}
