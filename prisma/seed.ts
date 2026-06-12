import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

const PASSWORD = "Enkai@2024!";

async function main() {
  console.log("Seeding production data...\n");

  // ─── 1. Permissions ─────────────────────────────────────────────────────

  const modules = [
    { module: "users", actions: ["create", "read", "update", "delete", "list"] },
    { module: "roles", actions: ["create", "read", "update", "delete", "list", "assign"] },
    { module: "workspaces", actions: ["create", "read", "update", "delete", "list", "manage_members"] },
    { module: "businesses", actions: ["create", "read", "update", "delete", "list"] },
    { module: "branches", actions: ["create", "read", "update", "delete", "list"] },
    { module: "stores", actions: ["create", "read", "update", "delete", "list"] },
    { module: "catalog", actions: ["create", "read", "update", "delete", "list"] },
    { module: "sales", actions: ["create", "read", "update", "void", "list"] },
    { module: "inventory", actions: ["create", "read", "update", "adjust", "list"] },
    { module: "purchases", actions: ["create", "read", "update", "approve", "list"] },
    { module: "expenses", actions: ["create", "read", "update", "approve", "list"] },
    { module: "reports", actions: ["read", "export"] },
    { module: "settings", actions: ["read", "update"] },
  ];

  const permissions: string[] = [];

  for (const { module, actions } of modules) {
    for (const action of actions) {
      const slug = `${module}.${action}`;
      await prisma.permission.upsert({
        where: { slug },
        update: {},
        create: {
          name: `${action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, " ")} ${module.replace(/_/g, " ")}`,
          slug,
          description: `Allows ${action} on ${module.replace(/_/g, " ")}`,
          module,
          action,
        },
      });
      permissions.push(slug);
    }
  }

  console.log(`✔ Created ${permissions.length} permissions`);

  // ─── 2. Platform Roles ──────────────────────────────────────────────────

  const platformRoles = [
    { name: "Super Admin", slug: "super-admin" },
    { name: "National Manager", slug: "national-manager" },
    { name: "National Sales Manager", slug: "national-sales-manager" },
    { name: "Region Manager", slug: "region-manager" },
    { name: "Team Leader", slug: "team-leader" },
    { name: "Freelancer", slug: "freelancer" },
    { name: "Marketing Manager", slug: "marketing-manager" },
    { name: "Support Agent", slug: "support-agent" },
    { name: "Finance Officer", slug: "finance-officer" },
  ];

  let superAdminRoleId: string | null = null;

  for (const rd of platformRoles) {
    const role = await prisma.role.upsert({
      where: { slug: rd.slug },
      update: {},
      create: {
        name: rd.name,
        slug: rd.slug,
        description: `Platform role: ${rd.name}`,
        scope: "PLATFORM",
        isSystem: true,
      },
    });

    if (rd.slug === "super-admin") {
      superAdminRoleId = role.id;
      for (const slug of permissions) {
        const perm = await prisma.permission.findUnique({ where: { slug } });
        if (perm) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: { roleId: role.id, permissionId: perm.id },
            },
            update: {},
            create: { roleId: role.id, permissionId: perm.id },
          }).catch(() => {});
        }
      }
    }
  }

  console.log(`✔ Created ${platformRoles.length} platform roles`);

  // ─── 3. Business Roles ──────────────────────────────────────────────────

  const businessRoles = [
    { name: "Owner", slug: "owner" },
    { name: "Manager", slug: "manager" },
    { name: "Cashier", slug: "cashier" },
    { name: "Accountant", slug: "accountant" },
    { name: "Doctor", slug: "doctor" },
    { name: "Pharmacist", slug: "pharmacist" },
    { name: "Chef", slug: "chef" },
  ];

  for (const rd of businessRoles) {
    await prisma.role.upsert({
      where: { slug: rd.slug },
      update: {},
      create: {
        name: rd.name,
        slug: rd.slug,
        description: `Business role: ${rd.name}`,
        scope: "BUSINESS",
        isSystem: true,
      },
    });
  }

  console.log(`✔ Created ${businessRoles.length} business roles`);

  // ─── 4. Super User ──────────────────────────────────────────────────────

  const passwordHash = await hashPassword(PASSWORD);

  const superUserId = "00000000-0000-0000-0000-000000000001";

  await prisma.user.upsert({
    where: { id: superUserId },
    update: {
      firstName: "masanja",
      lastName: "joseph",
      username: "masanja",
      email: "123456789.masanja.joseph@gmail.com",
      phone: "0794322797",
      isOnboarded: true,
    },
    create: {
      id: superUserId,
      email: "123456789.masanja.joseph@gmail.com",
      firstName: "masanja",
      lastName: "joseph",
      username: "masanja",
      phone: "0794322797",
      isOnboarded: true,
    },
  });

  await prisma.account.upsert({
    where: { id: `account-${superUserId}` },
    update: { password: passwordHash },
    create: {
      id: `account-${superUserId}`,
      userId: superUserId,
      accountId: "123456789.masanja.joseph@gmail.com",
      providerId: "credential",
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✔ Created super user (masanja)");

  // ─── 5. Assign Super Admin Role ─────────────────────────────────────────

  if (superAdminRoleId) {
    const existing = await prisma.userRole.findFirst({
      where: {
        userId: superUserId,
        roleId: superAdminRoleId,
        businessId: null,
      },
    });
    if (!existing) {
      await prisma.userRole.create({
        data: { userId: superUserId, roleId: superAdminRoleId },
      });
    }
  }

  console.log("✔ Assigned Super Admin role to masanja");

  // ─── 6. Sales Hierarchy ─────────────────────────────────────────────────

  const hierarchyLevels = [
    { level: 1, title: "National Sales Manager", slug: "national-sales-manager" },
    { level: 2, title: "Region Manager", slug: "region-manager" },
    { level: 3, title: "Team Leader", slug: "team-leader" },
    { level: 4, title: "Freelancer", slug: "freelancer" },
  ];

  const hierarchyIds: Record<string, string> = {};

  for (const h of hierarchyLevels) {
    const created = await prisma.salesHierarchy.upsert({
      where: { slug: h.slug },
      update: {},
      create: { level: h.level, title: h.title, slug: h.slug },
    });
    hierarchyIds[h.slug] = created.id;
  }

  console.log(`✔ Created ${hierarchyLevels.length} sales hierarchy levels`);

  // ─── 7. Subscription Plans ──────────────────────────────────────────────

  await prisma.subscriptionPlan.upsert({
    where: { slug: "daily-300" },
    update: {},
    create: {
      name: "Daily Subscription",
      slug: "daily-300",
      description: "300 TZS per day — basic business access",
      amount: new Prisma.Decimal(300),
      currency: "TZS",
      interval: "DAILY",
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { slug: "weekly-1500" },
    update: {},
    create: {
      name: "Weekly Subscription",
      slug: "weekly-1500",
      description: "1,500 TZS per week — standard plan",
      amount: new Prisma.Decimal(1500),
      currency: "TZS",
      interval: "WEEKLY",
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { slug: "monthly-5000" },
    update: {},
    create: {
      name: "Monthly Subscription",
      slug: "monthly-5000",
      description: "5,000 TZS per month — premium plan",
      amount: new Prisma.Decimal(5000),
      currency: "TZS",
      interval: "MONTHLY",
    },
  });

  console.log("✔ Created 3 subscription plans");

  // ─── 8. Commission Rules ────────────────────────────────────────────────

  const commissionRuleData = [
    { name: "Freelancer Flat Fee", hierarchySlug: "freelancer", type: "FLAT" as const, value: 50 },
    { name: "Freelancer Commission", hierarchySlug: "freelancer", type: "PERCENTAGE" as const, value: 10 },
    { name: "Team Leader Commission", hierarchySlug: "team-leader", type: "PERCENTAGE" as const, value: 5 },
    { name: "Region Manager Commission", hierarchySlug: "region-manager", type: "PERCENTAGE" as const, value: 3 },
    { name: "National Manager Commission", hierarchySlug: "national-sales-manager", type: "PERCENTAGE" as const, value: 2 },
  ];

  for (const cr of commissionRuleData) {
    const hId = hierarchyIds[cr.hierarchySlug];
    if (hId) {
      const existing = await prisma.commissionRule.findFirst({
        where: { name: cr.name },
      });
      if (!existing) {
        await prisma.commissionRule.create({
          data: {
            name: cr.name,
            hierarchyLevelId: hId,
            type: cr.type,
            value: new Prisma.Decimal(cr.value),
          },
        });
      }
    }
  }

  console.log(`✔ Created ${commissionRuleData.length} commission rules`);

  // ─── Done ───────────────────────────────────────────────────────────────

  console.log("\n✅ Production seeding complete!\n");
  console.log("Super user:");
  console.log("  Email:    123456789.masanja.joseph@gmail.com");
  console.log("  Password: Enkai@2024!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
