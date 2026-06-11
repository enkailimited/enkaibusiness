/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";
import { Pool } from "pg";

const prisma = new PrismaClient();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PASSWORD = "Test123!";

async function ensureAuthTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      phone TEXT,
      username TEXT,
      "firstName" TEXT,
      "lastName" TEXT,
      "isOnboarded" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" TIMESTAMPTZ,
      "refreshTokenExpiresAt" TIMESTAMPTZ,
      scope TEXT,
      password TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_session_userId ON "session"("userId");
    CREATE INDEX IF NOT EXISTS idx_account_userId ON "account"("userId");
  `);
}

async function main() {
  console.log("Seeding database...\n");
  await ensureAuthTables();

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

  // ─── 4. Create Better Auth Users ────────────────────────────────────────

  const passwordHash = await hashPassword(PASSWORD);

  const users = [
    { id: "00000000-0000-0000-0000-000000000001", email: "admin@enkai.com", name: "Super Admin" },
    { id: "00000000-0000-0000-0000-000000000002", email: "manager@demo.com", name: "Demo Manager" },
    { id: "00000000-0000-0000-0000-000000000003", email: "cashier@demo.com", name: "Demo Cashier" },
  ];

  for (const u of users) {
    const [firstName, lastName] = u.name.split(" ");
    
    // Upsert into User table (Prisma handles Better Auth fields too)
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        email: u.email,
        firstName,
        lastName: lastName || "",
        isOnboarded: true,
      },
      create: {
        id: u.id,
        email: u.email,
        firstName,
        lastName: lastName || "",
        isOnboarded: true,
      },
    });

    // Upsert into Account table for credentials
    await prisma.account.upsert({
      where: { id: `account-${u.id}` },
      update: {
        password: passwordHash,
      },
      create: {
        id: `account-${u.id}`,
        userId: u.id,
        accountId: u.email,
        providerId: "credential",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✔ Created ${users.length} auth users`);

  // ─── 5. Assign Platform Roles ───────────────────────────────────────────

  if (superAdminRoleId) {
    const existing = await prisma.userRole.findFirst({
      where: {
        userId: users[0].id,
        roleId: superAdminRoleId,
        businessId: null,
      },
    });
    if (!existing) {
      await prisma.userRole.create({
        data: { userId: users[0].id, roleId: superAdminRoleId },
      });
    }
  }

  console.log("✔ Assigned Super Admin role to admin@enkai.com");

  // ─── 6. Demo Workspace ─────────────────────────────────────────────────

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      description: "A demo workspace for testing",
    },
  });

  for (const u of users) {
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: { userId: u.id, workspaceId: workspace.id },
      },
      update: {},
      create: { userId: u.id, workspaceId: workspace.id, role: u.id === users[0].id ? "OWNER" : "MEMBER" },
    });
  }

  console.log("✔ Created demo workspace with members");

  // ─── 7. Demo Business (Commerce / Retail) ──────────────────────────────

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
      phone: "255712345678",
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

  console.log("✔ Created demo business (Commerce / Retail)");

  // ─── 8. Assign Business Roles ─────────────────────────────────────────

  const ownerRole = await prisma.role.findUnique({ where: { slug: "owner" } });
  const managerRole = await prisma.role.findUnique({ where: { slug: "manager" } });

  if (ownerRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_businessId: {
          userId: users[1].id,
          roleId: ownerRole.id,
          businessId: business.id,
        },
      },
      update: {},
      create: { userId: users[1].id, roleId: ownerRole.id, businessId: business.id },
    });
  }

  if (managerRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_businessId: {
          userId: users[2].id,
          roleId: managerRole.id,
          businessId: business.id,
        },
      },
      update: {},
      create: { userId: users[2].id, roleId: managerRole.id, businessId: business.id },
    });
  }

  console.log("✔ Assigned business roles (Owner, Manager)");

  // ─── 9. Demo Branch & Store ────────────────────────────────────────────

  const branch = await prisma.branch.upsert({
    where: {
      businessId_name: { businessId: business.id, name: "Main Branch" },
    },
    update: {},
    create: {
      businessId: business.id,
      name: "Main Branch",
      code: "BR-001",
      phone: "255712345678",
      address: "123 Main Street",
      city: "Dar es Salaam",
      country: "Tanzania",
      isHeadOffice: true,
      openingTime: "08:00",
      closingTime: "18:00",
    },
  });

  await prisma.store.upsert({
    where: { branchId_name: { branchId: branch.id, name: "Main Store" } },
    update: {},
    create: {
      branchId: branch.id,
      name: "Main Store",
      code: "ST-001",
      description: "Main retail store",
    },
  });

  console.log("✔ Created demo branch & store");

  // ─── 10. Categories ────────────────────────────────────────────────────

  const foodCat = await prisma.category.upsert({
    where: { businessId_slug: { businessId: business.id, slug: "food-groceries" } },
    update: {},
    create: { name: "Food & Groceries", slug: "food-groceries", businessId: business.id },
  });
  const bevCat = await prisma.category.upsert({
    where: { businessId_slug: { businessId: business.id, slug: "beverages" } },
    update: {},
    create: { name: "Beverages", slug: "beverages", businessId: business.id },
  });
  const pcCat = await prisma.category.upsert({
    where: { businessId_slug: { businessId: business.id, slug: "personal-care" } },
    update: {},
    create: { name: "Personal Care", slug: "personal-care", businessId: business.id },
  });
  await prisma.category.upsert({
    where: { businessId_slug: { businessId: business.id, slug: "household" } },
    update: {},
    create: { name: "Household", slug: "household", businessId: business.id },
  });
  await prisma.category.upsert({
    where: { businessId_slug: { businessId: business.id, slug: "electronics" } },
    update: {},
    create: { name: "Electronics", slug: "electronics", businessId: business.id },
  });
  console.log("✔ Created 5 categories");

  // ─── 11. Brands ─────────────────────────────────────────────────────────

  await prisma.brand.upsert({
    where: { businessId_slug: { businessId: business.id, slug: "generic" } },
    update: {},
    create: { name: "Generic", slug: "generic", businessId: business.id },
  });
  await prisma.brand.upsert({
    where: { businessId_slug: { businessId: business.id, slug: "premium" } },
    update: {},
    create: { name: "Premium", slug: "premium", businessId: business.id },
  });
  await prisma.brand.upsert({
    where: { businessId_slug: { businessId: business.id, slug: "local-best" } },
    update: {},
    create: { name: "Local Best", slug: "local-best", businessId: business.id },
  });
  console.log("✔ Created 3 brands");

  // ─── 12. Units ──────────────────────────────────────────────────────────

  const kgUnit = await prisma.unit.upsert({
    where: { businessId_name: { businessId: business.id, name: "Kilogram" } },
    update: {},
    create: { name: "Kilogram", abbreviation: "kg", type: "weight", businessId: business.id, isBase: true },
  });
  const lUnit = await prisma.unit.upsert({
    where: { businessId_name: { businessId: business.id, name: "Liter" } },
    update: {},
    create: { name: "Liter", abbreviation: "L", type: "volume", businessId: business.id, isBase: true },
  });
  const bagUnit = await prisma.unit.upsert({
    where: { businessId_name: { businessId: business.id, name: "Bag" } },
    update: {},
    create: { name: "Bag", abbreviation: "bag", type: "count", businessId: business.id },
  });
  const btlUnit = await prisma.unit.upsert({
    where: { businessId_name: { businessId: business.id, name: "Bottle" } },
    update: {},
    create: { name: "Bottle", abbreviation: "btl", type: "count", businessId: business.id },
  });
  const pcUnit = await prisma.unit.upsert({
    where: { businessId_name: { businessId: business.id, name: "Piece" } },
    update: {},
    create: { name: "Piece", abbreviation: "pc", type: "count", businessId: business.id },
  });
  console.log("✔ Created 5 units");

  // ─── 13. Demo Catalog Items ────────────────────────────────────────────

  const items = [
    { name: "Premium Rice 5kg", slug: "premium-rice-5kg", sku: "RICE-001", price: 15000, categoryId: foodCat?.id, unitId: bagUnit?.id },
    { name: "Cooking Oil 2L", slug: "cooking-oil-2l", sku: "OIL-001", price: 8000, categoryId: foodCat?.id, unitId: btlUnit?.id },
    { name: "Sugar 1kg", slug: "sugar-1kg", sku: "SUG-001", price: 3500, categoryId: foodCat?.id, unitId: kgUnit?.id },
    { name: "Mineral Water 1.5L", slug: "mineral-water-15l", sku: "WAT-001", price: 1500, categoryId: bevCat?.id, unitId: lUnit?.id },
    { name: "Soap Bar", slug: "soap-bar", sku: "SOAP-001", price: 2000, categoryId: pcCat?.id, unitId: pcUnit?.id },
  ];

  for (const item of items) {
    await prisma.catalogItem.upsert({
      where: { businessId_slug: { businessId: business.id, slug: item.slug } },
      update: {},
      create: {
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        price: new Prisma.Decimal(item.price),
        costPrice: new Prisma.Decimal(Math.round(item.price * 0.7)),
        categoryId: item.categoryId,
        unitId: item.unitId,
        businessId: business.id,
        itemType: "PRODUCT",
        currency: "TZS",
        isActive: true,
        trackStock: true,
      },
    });
  }

  console.log(`✔ Created ${items.length} demo catalog items`);

  // ─── 11. Sales Hierarchy ──────────────────────────────────────────────────

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

  // ─── 12. Sales Profiles ──────────────────────────────────────────────────

  const adminProfile = await prisma.salesProfile.upsert({
    where: { userId: users[0].id },
    update: {},
    create: {
      userId: users[0].id,
      phone: "255712345678",
      region: "Dar es Salaam",
      status: "ACTIVE",
      hierarchyId: hierarchyIds["national-sales-manager"],
    },
  });

  await prisma.salesProfile.upsert({
    where: { userId: users[1].id },
    update: {},
    create: {
      userId: users[1].id,
      phone: "255712345679",
      region: "Dar es Salaam",
      status: "ACTIVE",
      hierarchyId: hierarchyIds["region-manager"],
      managerId: adminProfile.id,
    },
  });

  await prisma.salesProfile.upsert({
    where: { userId: users[2].id },
    update: {},
    create: {
      userId: users[2].id,
      phone: "255712345680",
      region: "Dar es Salaam",
      status: "ACTIVE",
      hierarchyId: hierarchyIds["freelancer"],
      managerId: adminProfile.id,
    },
  });

  console.log("✔ Created 3 sales profiles");

  // ─── 13. Sample Leads ────────────────────────────────────────────────────

  const leadData = [
    { firstName: "Juma", lastName: "Moshi", email: "juma@example.com", phone: "255712111111", businessName: "Juma Groceries", status: "NEW" },
    { firstName: "Amina", lastName: "Salim", email: "amina@example.com", phone: "255712222222", businessName: "Amina Pharma", status: "CONTACTED" },
    { firstName: "Bakari", lastName: "Omar", email: "bakari@example.com", phone: "255712333333", businessName: "Bakari Cafe", status: "INTERESTED" },
    { firstName: "Mwanamisi", lastName: "Ali", email: "mwanamisi@example.com", phone: "255712444444", businessName: "Mwanamisi Retail", status: "DEMO" },
    { firstName: "Hassan", lastName: "Ramadhan", email: "hassan@example.com", phone: "255712555555", businessName: "Hassan Butchery", status: "NEGOTIATION" },
  ];

  const freemanProfile = await prisma.salesProfile.findFirst({
    where: { userId: users[2].id },
  });

  for (const ld of leadData) {
    const existing = await prisma.lead.findFirst({
      where: { email: ld.email },
    });
    if (!existing) {
      await prisma.lead.create({
        data: {
          ...ld as any,
          status: ld.status as any,
          source: "SALES_REGISTRATION",
          assignedToId: freemanProfile?.id,
        },
      });
    }
  }

  console.log(`✔ Created ${leadData.length} sample leads`);

  // ─── 14. Subscription Plans ──────────────────────────────────────────────

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

  // ─── 15. Commission Rules ────────────────────────────────────────────────

  const commissionRuleData = [
    { name: "Freelancer Flat Fee", hierarchySlug: "freelancer", type: "FLAT", value: 50 },
    { name: "Freelancer Commission", hierarchySlug: "freelancer", type: "PERCENTAGE", value: 10 },
    { name: "Team Leader Commission", hierarchySlug: "team-leader", type: "PERCENTAGE", value: 5 },
    { name: "Region Manager Commission", hierarchySlug: "region-manager", type: "PERCENTAGE", value: 3 },
    { name: "National Manager Commission", hierarchySlug: "national-sales-manager", type: "PERCENTAGE", value: 2 },
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
            type: cr.type as any,
            value: new Prisma.Decimal(cr.value),
          },
        });
      }
    }
  }

  console.log(`✔ Created ${commissionRuleData.length} commission rules`);

  // ─── 16. Distribution Campaign ───────────────────────────────────────────

  const campaign = await prisma.distributionCampaign.upsert({
    where: { slug: "initial-qr-campaign" },
    update: {},
    create: {
      name: "Initial QR Distribution",
      slug: "initial-qr-campaign",
      description: "First batch of QR codes for early adopters",
      totalQRCodes: 100,
      status: "ACTIVE",
      createdById: users[0].id,
    },
  });

  // Generate 5 sample QR codes
  for (let i = 1; i <= 5; i++) {
    await prisma.qRCode.upsert({
      where: { code: `ENK-${String(i).padStart(4, "0")}` },
      update: {},
      create: {
        campaignId: campaign.id,
        code: `ENK-${String(i).padStart(4, "0")}`,
        status: i <= 2 ? "INSTALLED" : "UNASSIGNED",
        businessId: i <= 2 ? business.id : undefined,
      },
    });
  }

  console.log("✔ Created distribution campaign with 5 QR codes");

  // ─── 17. Customer Groups ───────────────────────────────────────────────

  const customerGroups = [
    { name: "General", description: "Regular retail customers", discountPercent: 0, isDefault: true },
    { name: "VIP", description: "Premium customers", discountPercent: 5, isDefault: false },
    { name: "Wholesale", description: "Wholesale bulk buyers", discountPercent: 10, isDefault: false },
  ];

  for (const g of customerGroups) {
    await prisma.customerGroup.upsert({
      where: { businessId_name: { businessId: business.id, name: g.name } },
      update: {},
      create: { ...g, businessId: business.id, discountPercent: new Prisma.Decimal(g.discountPercent) },
    });
  }
  console.log(`✔ Created ${customerGroups.length} customer groups`);

  // ─── 21. Customers ─────────────────────────────────────────────────────

  const customers = [
    { firstName: "Asha", lastName: "Mohamed", email: "asha@email.com", phone: "255713111111", customerType: "retail" },
    { firstName: "Juma", lastName: "Hassan", email: "juma@email.com", phone: "255713222222", customerType: "wholesale" },
    { firstName: "Mariam", lastName: "Said", email: "mariam@email.com", phone: "255713333333", customerType: "retail" },
  ];

  for (const c of customers) {
    const existing = await prisma.customer.findFirst({ where: { email: c.email } });
    if (!existing) {
      await prisma.customer.create({ data: { ...c, businessId: business.id } });
    }
  }
  console.log(`✔ Created ${customers.length} customers`);

  // ─── 22. Suppliers ─────────────────────────────────────────────────────

  const suppliers = [
    { name: "Tanzania Wholesalers Ltd", email: "info@tzwho.co.tz", phone: "255714111111", city: "Dar es Salaam", supplierType: "local" },
    { name: "East Africa Distributors", email: "orders@ead.co.tz", phone: "255714222222", city: "Dar es Salaam", supplierType: "local" },
  ];

  for (const s of suppliers) {
    const existing = await prisma.supplier.findFirst({ where: { email: s.email } });
    if (!existing) {
      await prisma.supplier.create({ data: { ...s, businessId: business.id } });
    }
  }
  console.log(`✔ Created ${suppliers.length} suppliers`);

  // ─── 23. Payment Methods ───────────────────────────────────────────────

  const paymentMethods = [
    { name: "Cash", type: "cash" },
    { name: "M-Pesa", type: "mobile" },
    { name: "Tigo Pesa", type: "mobile" },
    { name: "Airtel Money", type: "mobile" },
    { name: "CRDB Bank", type: "bank" },
    { name: "NMB Bank", type: "bank" },
    { name: "Card Payment", type: "card" },
  ];

  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { businessId_name: { businessId: business.id, name: pm.name } },
      update: {},
      create: { ...pm, businessId: business.id },
    });
  }
  console.log(`✔ Created ${paymentMethods.length} payment methods`);

  // ─── 24. Expense Categories ────────────────────────────────────────────

  const expenseCategories = [
    { name: "Rent", description: "Rental expenses" },
    { name: "Utilities", description: "Electricity, water, internet" },
    { name: "Salaries", description: "Employee salaries and wages" },
    { name: "Transport", description: "Transportation and logistics" },
    { name: "Office Supplies", description: "Office consumables" },
  ];

  for (const ec of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { businessId_name: { businessId: business.id, name: ec.name } },
      update: {},
      create: { ...ec, businessId: business.id },
    });
  }
  console.log(`✔ Created ${expenseCategories.length} expense categories`);

  // ─── 25. Inventory Location ────────────────────────────────────────────

  let location = await prisma.inventoryLocation.findFirst({
    where: { businessId: business.id, branchId: branch.id, storeId: null },
  });
  if (!location) {
    location = await prisma.inventoryLocation.create({
      data: {
        businessId: business.id,
        branchId: branch.id,
        name: "Main Store Inventory",
        type: "branch",
      },
    });
  }
  console.log("✔ Created main inventory location");

  // ─── 26. Inventory Balances ────────────────────────────────────────────

  const catItems = await prisma.catalogItem.findMany({
    where: { businessId: business.id },
    take: 3,
  });

  for (const item of catItems) {
    const existing = await prisma.inventoryBalance.findFirst({
      where: { locationId: location.id, catalogItemId: item.id, variantId: null },
    });
    if (!existing) {
      await prisma.inventoryBalance.create({
        data: {
          locationId: location.id,
          catalogItemId: item.id,
          quantityOnHand: new Prisma.Decimal(100),
          quantityAvailable: new Prisma.Decimal(100),
          quantityCommitted: new Prisma.Decimal(0),
          reorderPoint: new Prisma.Decimal(10),
          maxStock: new Prisma.Decimal(500),
        },
      });
    }
  }
  console.log(`✔ Created inventory balances for ${catItems.length} items`);

  // ─── 27. Staff & Assignments ───────────────────────────────────────────

  for (const u of users.slice(1)) {
    const staff = await prisma.staff.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        businessId: business.id,
        position: u.id === users[1].id ? "Manager" : "Cashier",
        isActive: true,
      },
    });

    const existingAssignment = await prisma.staffAssignment.findFirst({
      where: { staffId: staff.id, level: "business", branchId: null, storeId: null },
    });
    if (!existingAssignment) {
      await prisma.staffAssignment.create({
        data: {
          staffId: staff.id,
          level: "business",
          businessId: business.id,
          isPrimary: true,
        },
      });
    }
  }
  console.log("✔ Created staff profiles with assignments");

  // ─── 28. Settings ─────────────────────────────────────────────────────

  const defaultSettings = [
    { key: "business.name", value: "Demo Shop", type: "string" },
    { key: "business.currency", value: "TZS", type: "string" },
    { key: "business.timezone", value: "Africa/Dar_es_Salaam", type: "string" },
    { key: "tax.name", value: "VAT", type: "string" },
    { key: "tax.rate", value: "18", type: "number" },
    { key: "receipt.showLogo", value: "true", type: "boolean" },
    { key: "receipt.showTax", value: "true", type: "boolean" },
    { key: "receipt.footer", value: "Thank you for your purchase!", type: "string" },
    { key: "numbering.invoicePrefix", value: "INV-", type: "string" },
    { key: "numbering.purchasePrefix", value: "PO-", type: "string" },
    { key: "numbering.receiptPrefix", value: "RCP-", type: "string" },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { businessId_key: { businessId: business.id, key: s.key } },
      update: {},
      create: { ...s, businessId: business.id },
    });
  }
  console.log(`✔ Created ${defaultSettings.length} business settings`);

  // ─── Done ───────────────────────────────────────────────────────────────

  console.log("\n✅ Seeding complete!\n");
  console.log("Test accounts:");
  console.log("  Platform Admin: admin@enkai.com / Test123!");
  console.log("  Business Owner: manager@demo.com / Test123!");
  console.log("  Business Staff: cashier@demo.com / Test123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
