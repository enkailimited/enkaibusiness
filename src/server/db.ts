import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1017"]);
const MAX_RETRIES = 3;
const BASE_DELAY = 1500;

function createPrismaClient() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  client.$use(async (params, next) => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await next(params);
      } catch (error: unknown) {
        lastError = error;
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          RETRYABLE_CODES.has(error.code)
        ) {
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, BASE_DELAY * (attempt + 1)));
            continue;
          }
        }
        throw error;
      }
    }
    throw lastError;
  });

  return client;
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function warmDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
