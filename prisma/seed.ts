import { PrismaClient } from "@prisma/client";
import { PLATFORM_ROLES, BUSINESS_ROLES } from "../src/types/enums";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Permissions ──────────────────────────────────────────────────────────

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

  const permissions: Array<{ id: string }> = [];

  for (const { module, actions } of modules) {
    for (const action of actions) {
      const slug = `${module}.${action}`;
      const permission = await prisma.permission.upsert({
        where: { slug },
        update: {},
        create: {
          name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.replace(/_/g, " ")}`,
          slug,
          description: `Allows ${action} on ${module.replace(/_/g, " ")}`,
          module,
          action,
        },
      });
      permissions.push(permission);
    }
  }

  console.log(`Created ${permissions.length} permissions`);

  // ─── Platform Roles ───────────────────────────────────────────────────────

  for (const roleData of PLATFORM_ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: roleData.slug },
      update: {},
      create: {
        name: roleData.name,
        slug: roleData.slug,
        description: `Platform role: ${roleData.name}`,
        scope: "PLATFORM",
        isSystem: true,
      },
    });

    if (roleData.slug === "super-admin") {
      for (const permission of permissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: permission.id },
          },
          update: {},
          create: { roleId: role.id, permissionId: permission.id },
        }).catch(() => {});
      }
      console.log(`Assigned all permissions to ${roleData.name}`);
    }
  }

  console.log(`Created ${PLATFORM_ROLES.length} platform roles`);

  // ─── Business Roles ────────────────────────────────────────────────────────

  for (const roleData of BUSINESS_ROLES) {
    await prisma.role.upsert({
      where: { slug: roleData.slug },
      update: {},
      create: {
        name: roleData.name,
        slug: roleData.slug,
        description: `Business role: ${roleData.name}`,
        scope: "BUSINESS",
        isSystem: true,
      },
    });
  }

  console.log(`Created ${BUSINESS_ROLES.length} business roles`);

  // ─── Admin User ───────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: "admin@enkai.com" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "admin@enkai.com",
      firstName: "Super",
      lastName: "Admin",
      password: "",
      isOnboarded: true,
    },
  });

  const superAdminRole = await prisma.role.findUnique({
    where: { slug: "super-admin" },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_businessId: {
          userId: admin.id,
          roleId: superAdminRole.id,
          businessId: "",
        },
      },
      update: {},
      create: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    });
  }

  console.log("Created admin user: admin@enkai.com");

  // ─── Demo Workspace ────────────────────────────────────────────────────────

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      description: "A demo workspace for testing",
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: { userId: admin.id, workspaceId: workspace.id },
    },
    update: {},
    create: {
      userId: admin.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  console.log("Created demo workspace");

  // ─── Demo Business ────────────────────────────────────────────────────────

  const business = await prisma.business.upsert({
    where: {
      workspaceId_slug: { workspaceId: workspace.id, slug: "demo-shop" },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "Demo Shop",
      slug: "demo-shop",
      email: "shop@demo.com",
      phone: "+255712345678",
      currency: "TZS",
      timezone: "Africa/Dar_es_Salaam",
    },
  });

  await prisma.businessMode.upsert({
    where: {
      businessId_industry_mode: {
        businessId: business.id,
        industry: "COMMERCE",
        mode: "RETAIL",
      },
    },
    update: {},
    create: {
      businessId: business.id,
      industry: "COMMERCE",
      mode: "RETAIL",
    },
  });

  console.log("Created demo business with retail mode");

  // ─── Demo Branch ──────────────────────────────────────────────────────────

  const branch = await prisma.branch.upsert({
    where: {
      businessId_name: { businessId: business.id, name: "Main Branch" },
    },
    update: {},
    create: {
      businessId: business.id,
      name: "Main Branch",
      code: "BR-001",
      phone: "+255712345678",
      address: "123 Main Street",
      city: "Dar es Salaam",
      country: "Tanzania",
      isHeadOffice: true,
      openingTime: "08:00",
      closingTime: "18:00",
    },
  });

  console.log("Created main branch");

  // ─── Demo Store ───────────────────────────────────────────────────────────

  await prisma.store.upsert({
    where: {
      branchId_name: { branchId: branch.id, name: "Main Store" },
    },
    update: {},
    create: {
      branchId: branch.id,
      name: "Main Store",
      code: "ST-001",
      description: "Main retail store",
    },
  });

  console.log("Created main store");

  // ─── Demo Catalog Items ───────────────────────────────────────────────────

  const items = [
    { name: "Premium Rice 5kg", slug: "premium-rice-5kg", sku: "RICE-001", price: 15000, category: "Food & Groceries", unit: "bag" },
    { name: "Cooking Oil 2L", slug: "cooking-oil-2l", sku: "OIL-001", price: 8000, category: "Food & Groceries", unit: "bottle" },
    { name: "Sugar 1kg", slug: "sugar-1kg", sku: "SUG-001", price: 3500, category: "Food & Groceries", unit: "kg" },
    { name: "Mineral Water 1.5L", slug: "mineral-water-15l", sku: "WAT-001", price: 1500, category: "Beverages", unit: "bottle" },
    { name: "Soap Bar", slug: "soap-bar", sku: "SOAP-001", price: 2000, category: "Personal Care", unit: "piece" },
  ];

  for (const item of items) {
    await prisma.catalogItem.upsert({
      where: {
        businessId_slug: { businessId: business.id, slug: item.slug },
      },
      update: {},
      create: {
        ...item,
        businessId: business.id,
        itemType: "PRODUCT",
        currency: "TZS",
        costPrice: Math.round(item.price * 0.7),
        isActive: true,
        trackStock: true,
      },
    });
  }

  console.log(`Created ${items.length} demo catalog items`);
  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
