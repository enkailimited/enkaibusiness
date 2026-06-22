import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Assigning Owner role to business creators...\n");

  const ownerRole = await prisma.role.findUnique({ where: { slug: "owner" } });
  if (!ownerRole) {
    console.log("❌ Owner role not found. Run seed first or check database.");
    process.exit(1);
  }

  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, createdById: true, workspaceId: true },
  });

  let assigned = 0;
  let skipped = 0;

  for (const business of businesses) {
    let targetUserId = business.createdById;

    if (!targetUserId) {
      const workspaceOwner = await prisma.workspaceMember.findFirst({
        where: { workspaceId: business.workspaceId, role: "OWNER" },
        select: { userId: true },
      });
      if (!workspaceOwner) {
        skipped++;
        continue;
      }
      targetUserId = workspaceOwner.userId;
    }

    const existing = await prisma.userRole.findFirst({
      where: {
        userId: targetUserId,
        roleId: ownerRole.id,
        businessId: business.id,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.userRole.create({
      data: {
        userId: targetUserId,
        roleId: ownerRole.id,
        businessId: business.id,
      },
    });

    console.log(`  ✔ ${business.name} — Owner role assigned`);
    assigned++;
  }

  console.log(`\n✅ Done. Assigned: ${assigned}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
