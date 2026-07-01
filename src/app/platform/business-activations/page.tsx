import "server-only";

import { requireAuth } from "@/server/auth";
import { prisma } from "@/server/db";
import { redirect } from "next/navigation";
import { AdminActivationList } from "@/features/activation/components/admin-activation-list";

export default async function BusinessActivationsPage() {
  const user = await requireAuth();

  const hasPermission = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      role: { slug: { in: ["platform_admin", "admin", "super_admin"] } },
    },
  });

  if (!hasPermission) {
    redirect("/platform/dashboard");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Business Activations</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve business setup payments</p>
      </div>
      <AdminActivationList />
    </div>
  );
}
