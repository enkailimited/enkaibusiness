import { prisma } from "./src/server/db";

async function main() {
  const sessions = await prisma.session.findMany();
  console.log("Sessions:", sessions);
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log("Users:", users);
}

main();
