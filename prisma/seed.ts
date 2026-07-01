import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

const PASSWORD = "Enkai@2024!";

async function main() {
  console.log("Seeding production data...\n");

  // ─── 0. Business Types ──────────────────────────────────────────────────

  const commerceType = await prisma.businessType.upsert({
    where: { slug: "commerce" },
    update: {},
    create: {
      name: "Commerce",
      slug: "commerce",
      description: "Retail and wholesale commerce businesses",
      sortOrder: 1,
      modes: {
        create: [
          { slug: "retail", name: "Retail", sortOrder: 1 },
          { slug: "wholesale", name: "Wholesale", sortOrder: 2 },
          { slug: "both", name: "Retail & Wholesale", sortOrder: 3 },
        ],
      },
      modules: {
        create: [
          { module: "catalog", isRequired: true },
          { module: "inventory", isRequired: true },
          { module: "sales", isRequired: true },
          { module: "pos", isRequired: false },
          { module: "purchases", isRequired: false },
          { module: "expenses", isRequired: false },
          { module: "customers", isRequired: true },
          { module: "suppliers", isRequired: false },
          { module: "invoices", isRequired: false },
          { module: "quotations", isRequired: false },
          { module: "payments", isRequired: true },
          { module: "subscriptions", isRequired: true },
          { module: "reports", isRequired: true },
          { module: "qr_ordering", isRequired: false },
          { module: "delivery", isRequired: false },
          { module: "returns", isRequired: false },
        ],
      },
      catalogTypes: {
        create: [
          { slug: "product", name: "Product", sortOrder: 1 },
          { slug: "service", name: "Service", sortOrder: 2 },
        ],
      },
    },
  });

  console.log(`✔ Business Type: ${commerceType.name}`);

  const healthcareType = await prisma.businessType.upsert({
    where: { slug: "healthcare" },
    update: {},
    create: {
      name: "Healthcare",
      slug: "healthcare",
      description: "Clinics, hospitals, and pharmacy businesses",
      sortOrder: 2,
      modes: {
        create: [
          { slug: "pharmacy", name: "Pharmacy", sortOrder: 1 },
          { slug: "clinic", name: "Clinic", sortOrder: 2 },
          { slug: "hospital", name: "Hospital", sortOrder: 3 },
        ],
      },
      modules: {
        create: [
          { module: "catalog", isRequired: true },
          { module: "inventory", isRequired: true },
          { module: "sales", isRequired: true },
          { module: "purchases", isRequired: false },
          { module: "expenses", isRequired: false },
          { module: "customers", isRequired: true },
          { module: "payments", isRequired: true },
          { module: "reports", isRequired: true },
          { module: "subscriptions", isRequired: true },
        ],
      },
      catalogTypes: {
        create: [
          { slug: "medicine", name: "Medicine", sortOrder: 1 },
          { slug: "service", name: "Service", sortOrder: 2 },
        ],
      },
    },
  });
  console.log(`✔ Business Type: ${healthcareType.name}`);

  const agricultureType = await prisma.businessType.upsert({
    where: { slug: "agriculture" },
    update: {},
    create: {
      name: "Agriculture",
      slug: "agriculture",
      description: "Farming and agricultural businesses",
      sortOrder: 3,
      modes: {
        create: [
          { slug: "general", name: "General", sortOrder: 1 },
        ],
      },
      modules: {
        create: [
          { module: "catalog", isRequired: true },
          { module: "inventory", isRequired: true },
          { module: "sales", isRequired: true },
          { module: "purchases", isRequired: true },
          { module: "expenses", isRequired: true },
          { module: "customers", isRequired: false },
          { module: "payments", isRequired: true },
          { module: "reports", isRequired: true },
          { module: "subscriptions", isRequired: false },
        ],
      },
      catalogTypes: {
        create: [
          { slug: "product", name: "Product", sortOrder: 1 },
          { slug: "livestock", name: "Livestock", sortOrder: 2 },
        ],
      },
    },
  });
  console.log(`✔ Business Type: ${agricultureType.name}`);

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
    { module: "subscriptions", actions: ["create", "read", "update", "delete", "list", "approve", "suspend", "activate"] },
    { module: "payments", actions: ["create", "read", "update", "approve", "reject", "list"] },
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

  const allSlugs = permissions;

  const rolePermissionsMap: Record<string, string[]> = {
    "super-admin": allSlugs,
    "national-manager": [
      "users.read", "users.list",
      "roles.read", "roles.list",
      "workspaces.read", "workspaces.list", "workspaces.manage_members",
      "businesses.read", "businesses.list",
      "branches.read", "branches.list",
      "stores.read", "stores.list",
      "catalog.read", "catalog.list",
      "sales.read", "sales.list",
      "inventory.read", "inventory.list",
      "purchases.read", "purchases.list",
      "expenses.read", "expenses.list",
      "reports.read", "reports.export",
      "settings.read",
    ],
    "national-sales-manager": [
      "users.read", "users.list",
      "workspaces.read", "workspaces.list",
      "businesses.read", "businesses.list",
      "branches.read", "branches.list",
      "sales.read", "sales.list",
      "inventory.read", "inventory.list",
      "purchases.read", "purchases.list",
      "reports.read", "reports.export",
      "settings.read",
    ],
    "region-manager": [
      "users.read",
      "workspaces.read",
      "businesses.read",
      "branches.read",
      "sales.read", "sales.list",
      "inventory.read",
      "purchases.read",
      "reports.read",
    ],
    "team-leader": [
      "users.read",
      "sales.read", "sales.list",
      "reports.read",
    ],
    "freelancer": [
      "sales.read", "sales.list",
      "reports.read",
    ],
    "marketing-manager": [
      "users.read", "users.list",
      "workspaces.read", "workspaces.list",
      "businesses.read", "businesses.list",
      "branches.read", "branches.list",
      "reports.read", "reports.export",
      "settings.read",
    ],
    "support-agent": [
      "users.read", "users.list",
      "workspaces.read", "workspaces.list",
      "businesses.read", "businesses.list",
      "branches.read",
      "settings.read",
    ],
    "finance-officer": [
      "users.read",
      "businesses.read",
      "sales.read", "sales.list",
      "purchases.read", "purchases.list",
      "expenses.read", "expenses.list",
      "reports.read", "reports.export",
      "settings.read", "settings.update",
      "subscriptions.read", "subscriptions.list", "subscriptions.approve", "subscriptions.activate",
      "payments.read", "payments.list", "payments.approve", "payments.reject",
    ],
  };

  let superAdminRoleId: string | null = null;

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
    }

    const rolePerms = rolePermissionsMap[rd.slug] || [];
    for (const slug of rolePerms) {
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

  console.log(`✔ Created ${platformRoles.length} platform roles with permissions`);

  // ─── 3. Business Roles ──────────────────────────────────────────────────

  const businessRolePermissionsMap: Record<string, string[]> = {
    owner: allSlugs,
    manager: [
      "branches.read", "branches.list",
      "stores.read", "stores.list",
      "catalog.create", "catalog.read", "catalog.update", "catalog.list",
      "sales.create", "sales.read", "sales.update", "sales.void", "sales.list",
      "inventory.create", "inventory.read", "inventory.update", "inventory.adjust", "inventory.list",
      "purchases.create", "purchases.read", "purchases.update", "purchases.list",
      "expenses.create", "expenses.read", "expenses.update", "expenses.list",
      "reports.read", "reports.export",
      "settings.read", "settings.update",
    ],
    accountant: [
      "sales.read", "sales.list",
      "purchases.read", "purchases.list",
      "expenses.create", "expenses.read", "expenses.update", "expenses.approve", "expenses.list",
      "reports.read", "reports.export",
      "settings.read",
    ],
    cashier: [
      "sales.create", "sales.read", "sales.list",
      "inventory.read", "inventory.list",
    ],
    doctor: [
      "catalog.read", "catalog.list",
      "sales.create", "sales.read", "sales.list",
      "inventory.read", "inventory.list",
      "customers.read", "customers.list",
    ],
    pharmacist: [
      "catalog.create", "catalog.read", "catalog.update", "catalog.list",
      "sales.create", "sales.read", "sales.list",
      "inventory.create", "inventory.read", "inventory.update", "inventory.adjust", "inventory.list",
      "purchases.create", "purchases.read", "purchases.list",
    ],
    chef: [
      "catalog.read", "catalog.list",
      "inventory.read", "inventory.list",
    ],
  };

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
    const role = await prisma.role.upsert({
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

    const rolePerms = businessRolePermissionsMap[rd.slug] || [];
    for (const slug of rolePerms) {
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

  console.log(`✔ Created ${businessRoles.length} business roles with permissions`);

  // ─── 4. Workspace Roles ─────────────────────────────────────────────────

  const workspaceRolePermissionsMap: Record<string, string[]> = {
    owner: allSlugs.filter((s) => s.startsWith("workspaces.") || s.startsWith("users.") || s.startsWith("businesses.") || s.startsWith("settings.")),
    admin: [
      "workspaces.read", "workspaces.update", "workspaces.list", "workspaces.manage_members",
      "businesses.read", "businesses.list",
      "users.read", "users.list",
      "settings.read",
    ],
    member: [
      "workspaces.read", "workspaces.list",
      "businesses.read", "businesses.list",
    ],
    guest: [],
  };

  const workspaceRoles = [
    { name: "Workspace Owner", slug: "owner" },
    { name: "Workspace Admin", slug: "admin" },
    { name: "Workspace Member", slug: "member" },
    { name: "Workspace Guest", slug: "guest" },
  ];

  for (const rd of workspaceRoles) {
    const role = await prisma.role.upsert({
      where: { slug: rd.slug + "-workspace" },
      update: {},
      create: {
        name: rd.name,
        slug: rd.slug + "-workspace",
        description: `Workspace role: ${rd.name}`,
        scope: "WORKSPACE",
        isSystem: true,
      },
    });

    const rolePerms = workspaceRolePermissionsMap[rd.slug] || [];
    for (const slug of rolePerms) {
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

  console.log(`✔ Created ${workspaceRoles.length} workspace roles with permissions`);

  // ─── 5. Super User ──────────────────────────────────────────────────────

  const passwordHash = await hashPassword(PASSWORD);

  const superUserId = "00000000-0000-0000-0000-000000000001";

  await prisma.user.upsert({
    where: { id: superUserId },
    update: {
      firstName: "masanja",
      lastName: "joseph",
      username: "masanja",
      email: "123456789.masanja@gmail.com",
      phone: "0794322797",
      gender: "male",
      isOnboarded: true,
    },
    create: {
      id: superUserId,
      email: "123456789.masanja@gmail.com",
      firstName: "masanja",
      lastName: "joseph",
      username: "masanja",
      phone: "0794322797",
      gender: "male",
      isOnboarded: true,
    },
  });

  await prisma.account.upsert({
    where: { id: `account-${superUserId}` },
    update: { password: passwordHash },
    create: {
      id: `account-${superUserId}`,
      userId: superUserId,
      accountId: "123456789.masanja@gmail.com",
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

  // Remove old plans that don't match the new naming scheme
  const oldPlanSlugs = ["weekly-1500", "monthly-5000"];
  for (const slug of oldPlanSlugs) {
    const oldPlan = await prisma.subscriptionPlan.findUnique({
      where: { slug },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (oldPlan && oldPlan._count.subscriptions === 0) {
      await prisma.subscriptionPlan.delete({ where: { slug } });
    }
  }

  const planTiers = [
    { daily: 300, name: "Msingi" },
    { daily: 500, name: "Biashara" },
    { daily: 1000, name: "Biashara Plus" },
    { daily: 1500, name: "Biashara Premium" },
  ];

  const intervals: { label: string; suffix: string; multiplier: number }[] = [
    { label: "Daily", suffix: "daily", multiplier: 1 },
    { label: "Weekly", suffix: "weekly", multiplier: 7 },
    { label: "Monthly", suffix: "monthly", multiplier: 30 },
  ];

  let planCount = 0;
  for (const tier of planTiers) {
    for (const interval of intervals) {
      const amount = tier.daily * interval.multiplier;
      const slug = `${interval.suffix}-${tier.daily}`;
      const name = `${interval.label} - ${tier.name}`;
      const desc = `${amount.toLocaleString()} TZS kwa ${interval.label.toLowerCase()} — mpango wa ${tier.name}`;
      await prisma.subscriptionPlan.upsert({
        where: { slug },
        update: {
          name,
          description: desc,
          amount: new Prisma.Decimal(amount),
        },
        create: {
          name,
          slug,
          description: desc,
          amount: new Prisma.Decimal(amount),
          currency: "TZS",
          interval: interval.suffix.toUpperCase() as "DAILY" | "WEEKLY" | "MONTHLY",
        },
      });
      planCount++;
    }
  }

  console.log(`✔ Created ${planCount} subscription plans`);

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
