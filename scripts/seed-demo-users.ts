import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();
const PASSWORD = "Enkai@2024!";

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const NOW = new Date();

async function main() {
  console.log("Seeding demo users and team...\n");

  const passwordHash = await hashPassword(PASSWORD);

  // ─── 1. Platform Staff ─────────────────────────────────────────────────

  interface StaffUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    phone: string;
    roleSlug: string;
  }

  const staffUsers: StaffUser[] = [
    { id: generateId(), email: "admin@enkai.co.tz", firstName: "Admin", lastName: "Mkuu", username: "admin", phone: "0712345678", roleSlug: "super-admin" },
    { id: generateId(), email: "manager@enkai.co.tz", firstName: "Manager", lastName: "Mkuu", username: "manager", phone: "0712345679", roleSlug: "national-manager" },
    { id: generateId(), email: "support@enkai.co.tz", firstName: "Support", lastName: "Team", username: "support", phone: "0712345680", roleSlug: "support-agent" },
    { id: generateId(), email: "finance@enkai.co.tz", firstName: "Finance", lastName: "Officer", username: "finance", phone: "0712345681", roleSlug: "finance-officer" },
    { id: generateId(), email: "marketing@enkai.co.tz", firstName: "Marketing", lastName: "Lead", username: "marketing", phone: "0712345682", roleSlug: "marketing-manager" },
  ];

  for (const u of staffUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        phone: u.phone,
        emailVerified: true,
        isOnboarded: true,
      },
    });

    await prisma.account.upsert({
      where: { id: `account-${u.id}` },
      update: { password: passwordHash },
      create: {
        id: `account-${u.id}`,
        userId: u.id,
        accountId: u.email,
        providerId: "credential",
        password: passwordHash,
        createdAt: NOW,
        updatedAt: NOW,
      },
    });

    const role = await prisma.role.findUnique({ where: { slug: u.roleSlug } });
    if (role) {
      const existing = await prisma.userRole.findFirst({
        where: { userId: u.id, roleId: role.id, businessId: null },
      });
      if (!existing) {
        await prisma.userRole.create({ data: { userId: u.id, roleId: role.id } });
      }
    }

    console.log(`  ✔ Staff: ${u.email} (${u.roleSlug})`);
  }

  // ─── 2. Sales Team ─────────────────────────────────────────────────────

  const salesTeamUsers: StaffUser[] = [
    { id: generateId(), email: "nsm@enkai.co.tz", firstName: "National", lastName: "Manager", username: "nsm", phone: "0712345690", roleSlug: "national-sales-manager" },
    { id: generateId(), email: "rm@enkai.co.tz", firstName: "Region", lastName: "Manager", username: "regionmgr", phone: "0712345691", roleSlug: "region-manager" },
    { id: generateId(), email: "tl1@enkai.co.tz", firstName: "Team", lastName: "Leader One", username: "teamleader1", phone: "0712345692", roleSlug: "team-leader" },
    { id: generateId(), email: "tl2@enkai.co.tz", firstName: "Team", lastName: "Leader Two", username: "teamleader2", phone: "0712345693", roleSlug: "team-leader" },
    { id: generateId(), email: "freelancer1@enkai.co.tz", firstName: "Freelancer", lastName: "Alpha", username: "freelancer1", phone: "0712345694", roleSlug: "freelancer" },
    { id: generateId(), email: "freelancer2@enkai.co.tz", firstName: "Freelancer", lastName: "Beta", username: "freelancer2", phone: "0712345695", roleSlug: "freelancer" },
    { id: generateId(), email: "freelancer3@enkai.co.tz", firstName: "Freelancer", lastName: "Gamma", username: "freelancer3", phone: "0712345696", roleSlug: "freelancer" },
  ];

  const hierarchyMap: Record<string, string> = {};
  const hierarchies = await prisma.salesHierarchy.findMany();
  for (const h of hierarchies) {
    hierarchyMap[h.slug] = h.id;
  }

  for (const u of salesTeamUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        phone: u.phone,
        emailVerified: true,
        isOnboarded: true,
      },
    });

    await prisma.account.upsert({
      where: { id: `account-${u.id}` },
      update: { password: passwordHash },
      create: {
        id: `account-${u.id}`,
        userId: u.id,
        accountId: u.email,
        providerId: "credential",
        password: passwordHash,
        createdAt: NOW,
        updatedAt: NOW,
      },
    });

    const role = await prisma.role.findUnique({ where: { slug: u.roleSlug } });
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId_businessId: { userId: u.id, roleId: role.id, businessId: "" } },
        update: {},
        create: { userId: u.id, roleId: role.id },
      });
    }

    const hierarchySlug = u.roleSlug === "freelancer" ? "freelancer"
      : u.roleSlug === "team-leader" ? "team-leader"
      : u.roleSlug === "region-manager" ? "region-manager"
      : "national-sales-manager";

    const hId = hierarchyMap[hierarchySlug];
    if (hId) {
      const existingProfile = await prisma.salesProfile.findUnique({ where: { userId: u.id } });
      if (!existingProfile) {
        await prisma.salesProfile.create({
          data: {
            userId: u.id,
            hierarchyId: hId,
            isActive: true,
          },
        });
      }
    }

    console.log(`  ✔ Sales: ${u.email} (${u.roleSlug})`);
  }

  // ─── 3. Register New Business via Freelancer (End-to-End) ─────────────

  console.log("\n─── Registering new business via Freelancer Alpha ───\n");

  const freelancerUser = salesTeamUsers.find((u) => u.email === "freelancer1@enkai.co.tz")!;

  // 3a. Create workspace for the new business
  const newWorkspaceId = generateId();
  const workspaceSlug = `biz-workspace-${Date.now()}`;

  await prisma.workspace.upsert({
    where: { id: newWorkspaceId },
    update: {},
    create: {
      id: newWorkspaceId,
      name: "Mama Ngede Shop",
      slug: workspaceSlug,
    },
  });

  // Add freelancer as workspace owner
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: freelancerUser.id, workspaceId: newWorkspaceId } },
    update: {},
    create: {
      workspaceId: newWorkspaceId,
      userId: freelancerUser.id,
      role: "OWNER",
    },
  });

  console.log("  ✔ Created workspace: Mama Ngede Shop");

  // 3b. Get subscription plan
  const plan = await prisma.subscriptionPlan.findFirst({ where: { isActive: true } });
  if (!plan) throw new Error("No active subscription plan found. Run seed first.");

  console.log(`  ✔ Using plan: ${plan.name} (${plan.amount} TZS / ${plan.interval})`);

  // 3c. Get commerce business type
  const commerceType = await prisma.businessType.findUnique({ where: { slug: "commerce" } });
  if (!commerceType) throw new Error("Commerce business type not found. Run seed first.");

  // 3d. Create the business (step-by-step like the engine)
  const businessId = generateId();

  await prisma.$transaction(async (tx) => {
    // Create business
    const business = await tx.business.create({
      data: {
        id: businessId,
        workspaceId: newWorkspaceId,
        businessTypeId: commerceType.id,
        name: "Mama Ngede Grocery",
        slug: `mama-ngede-${Date.now()}`,
        email: "mamangede@demo.com",
        phone: "0765432100",
        address: "123 Market Street, Dar es Salaam",
        currency: "TZS",
        timezone: "Africa/Dar_es_Salaam",
        status: "ACTIVE",
        isActive: true,
        createdById: freelancerUser.id,
        updatedById: freelancerUser.id,
      },
    });

    // Create business mode
    await tx.businessMode.create({
      data: {
        businessId: business.id,
        industry: "COMMERCE",
        mode: "retail",
      },
    });

    // Assign owner role
    const ownerRole = await tx.role.findUnique({ where: { slug: "owner" } });
    if (ownerRole) {
      await tx.userRole.create({
        data: { userId: freelancerUser.id, roleId: ownerRole.id, businessId: business.id },
      });
    }

    // Create main branch
    const branch = await tx.branch.create({
      data: {
        businessId: business.id,
        name: "Head Office",
        isHeadOffice: true,
        isActive: true,
      },
    });

    // Create inventory location
    await tx.inventoryLocation.create({
      data: {
        businessId: business.id,
        branchId: branch.id,
        name: "Head Office - Main Store",
        type: "store",
      },
    });

    // Create walk-in customer
    await tx.customer.create({
      data: {
        businessId: business.id,
        firstName: "Walk-in",
        lastName: "Customer",
        email: "walkin@internal",
        customerType: "WALK_IN",
      },
    });

    // Create cash payment method
    await tx.paymentMethod.create({
      data: {
        businessId: business.id,
        name: "Cash",
        type: "cash",
        isActive: true,
      },
    });

    // Create subscription
    const dailyRate = Number(plan.amount) / (plan.interval === "WEEKLY" ? 7 : plan.interval === "MONTHLY" ? 30 : 1);
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    const graceEndDate = new Date(endDate);
    graceEndDate.setDate(graceEndDate.getDate() + 30);

    await tx.subscription.create({
      data: {
        businessId: business.id,
        planId: plan.id,
        status: "ACTIVE",
        startDate,
        endDate,
        graceEndDate,
        dailyRate: new Prisma.Decimal(dailyRate),
        autoRenew: true,
      },
    });

    // Create subscription wallet
    await tx.subscriptionWallet.create({
      data: {
        businessId: business.id,
        balance: 0,
        totalDeposited: 0,
        totalConsumed: 0,
      },
    });

    // Create catalog categories
    const cat1 = await tx.category.create({
      data: { businessId: business.id, name: "Food & Beverages", slug: "food-beverages" },
    });
    const cat2 = await tx.category.create({
      data: { businessId: business.id, name: "Household Items", slug: "household-items" },
    });

    // Create sample products
    const products = [
      { name: "Cooking Oil 2L", slug: "cooking-oil-2l", sku: "CO-001", price: 8500, catId: cat1.id },
      { name: "Rice 5kg", slug: "rice-5kg", sku: "RC-001", price: 12500, catId: cat1.id },
      { name: "Sugar 2kg", slug: "sugar-2kg", sku: "SG-001", price: 5400, catId: cat1.id },
      { name: "Soap Bar", slug: "soap-bar", sku: "SP-001", price: 1500, catId: cat2.id },
      { name: "Detergent 500g", slug: "detergent-500g", sku: "DT-001", price: 3500, catId: cat2.id },
    ];

    for (const p of products) {
      await tx.catalogItem.create({
        data: {
          businessId: business.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          itemType: "PRODUCT",
          isService: false,
          trackStock: true,
          categoryId: p.catId,
          createdById: freelancerUser.id,
          updatedById: freelancerUser.id,
        },
      });
    }

    // Create a default supplier
    await tx.supplier.create({
      data: {
        businessId: business.id,
        name: "Default Supplier",
        email: "supplier@demo.com",
      },
    });

    console.log(`  ✔ Created business: Mama Ngede Grocery`);
    console.log(`  ✔ Created ${products.length} products`);
    console.log(`  ✔ Subscription active until ${endDate.toLocaleDateString()}`);
  });

  // ─── Done ───────────────────────────────────────────────────────────────

  console.log("\n✅ Demo data seeding complete!\n");
  console.log("Platform staff:");
  console.log("  admin@enkai.co.tz       / Enkai@2024!  (Super Admin)");
  console.log("  manager@enkai.co.tz     / Enkai@2024!  (National Manager)");
  console.log("  support@enkai.co.tz     / Enkai@2024!  (Support Agent)");
  console.log("  finance@enkai.co.tz     / Enkai@2024!  (Finance Officer)");
  console.log("  marketing@enkai.co.tz   / Enkai@2024!  (Marketing Manager)");
  console.log("\nSales team:");
  console.log("  nsm@enkai.co.tz         / Enkai@2024!  (National Sales Manager)");
  console.log("  rm@enkai.co.tz          / Enkai@2024!  (Region Manager)");
  console.log("  tl1@enkai.co.tz         / Enkai@2024!  (Team Leader)");
  console.log("  tl2@enkai.co.tz         / Enkai@2024!  (Team Leader)");
  console.log("  freelancer1@enkai.co.tz / Enkai@2024!  (Freelancer - registered demo business)");
  console.log("  freelancer2@enkai.co.tz / Enkai@2024!  (Freelancer)");
  console.log("  freelancer3@enkai.co.tz / Enkai@2024!  (Freelancer)");
  console.log("\nDemo business (registered by Freelancer Alpha):");
  console.log("  Mama Ngede Grocery (Commerce / Retail)");
  console.log("  5 products, 2 categories, walk-in customer, default supplier");
}

main()
  .catch((e) => {
    console.error("Demo seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
