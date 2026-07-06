import { UserProfile } from "@/features/users/components/user-profile";
import { getCurrentUser } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/profile");
  }

  const [dbUser, staff, userRoles] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.staff.findFirst({ where: { userId: user.id }, select: { businessId: true } }),
    prisma.userRole.findMany({
      where: { userId: user.id },
      select: { role: { select: { id: true, name: true, slug: true, scope: true } } },
    }),
  ]);

  if (!dbUser) {
    redirect("/login?redirect=/profile");
  }

  const profile = {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    phone: dbUser.phone,
    username: dbUser.username,
    avatarUrl: dbUser.avatarUrl,
    isActive: dbUser.isActive,
    isOnboarded: dbUser.isOnboarded,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };

  const avatarBusinessId = staff?.businessId ?? undefined;
  const roles = userRoles.map((ur) => ur.role);

  return (
    <div className="space-y-6 pb-10">
      <UserProfile user={profile} avatarBusinessId={avatarBusinessId} roles={roles} />
    </div>
  );
}
