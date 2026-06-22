import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { PlatformDashboardContent } from "./dashboard-content";

const SALES_ROLES = [
  "national-sales-manager",
  "national-manager",
  "regional-manager",
  "team-leader",
  "freelancer",
];

export default async function PlatformDashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const isSalesTeam = user?.roles?.some((r) => SALES_ROLES.includes(r)) ?? false;
  if (isSalesTeam) {
    redirect("/platform/sales-team");
  }

  const isSuperAdmin = user?.roles?.includes("super-admin") ?? false;
  if (isSuperAdmin) {
    return <PlatformDashboardContent />;
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true, role: true },
  });

  if (membership && (membership.role === "OWNER" || membership.role === "ADMIN")) {
    redirect("/workspaces/dashboard");
  }

  return <PlatformDashboardContent />;
}
