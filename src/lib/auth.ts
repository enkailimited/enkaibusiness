import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { prisma } from "@/server/db";

export const auth = betterAuth({
  appName: "Enkai Business",
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    freshAge: 5 * 60,
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
      firstName: {
        type: "string",
        required: true,
        input: true,
      },
      lastName: {
        type: "string",
        required: true,
        input: true,
      },
      isOnboarded: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              firstName: (user as Record<string, unknown>).firstName as string || "",
              lastName: (user as Record<string, unknown>).lastName as string || "",
              phone: (user as Record<string, unknown>).phone as string || null,
            },
            create: {
              id: user.id,
              email: user.email,
              firstName: (user as Record<string, unknown>).firstName as string || "",
              lastName: (user as Record<string, unknown>).lastName as string || "",
              phone: (user as Record<string, unknown>).phone as string || null,
              isOnboarded: false,
            },
          });
        },
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  rateLimit: {
    window: 60,
    max: 20,
  },
});
