import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { prisma } from "@/server/db";
import { normalizePhone } from "@/lib/phone";

export const auth = betterAuth({
  appName: "Enkai Business",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  modelNames: {
    user: "User",
    session: "Session",
    account: "Account",
    verification: "Verification",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    sendResetPasswordEmail: async ({ user, url }) => {
      try {
        const { sendEmailWithDefaultConfig } = await import("@/notifications/email/services/smtp-service");
        const { renderTemplate } = await import("@/notifications/email/services/template-service");
        const tpl = await import("@/notifications/email/services/template-service").then(
          (m) => m.SYSTEM_TEMPLATES.find((t) => t.slug === "password-reset"),
        );
        if (tpl) {
          const rendered = await renderTemplate(tpl, { resetUrl: url });
          await sendEmailWithDefaultConfig({
            to: user.email,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
          });
        } else {
          await sendEmailWithDefaultConfig({
            to: user.email,
            subject: "Reset your password",
            html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
          });
        }
      } catch (err) {
        console.error("Failed to send password reset email:", err);
      }
    },
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    freshAge: 5 * 60,
    rememberMeExpiresIn: 30 * 24 * 60 * 60,
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      username: { type: "string", required: false },
      firstName: { type: "string", required: true, input: true },
      lastName: { type: "string", required: true, input: true },
      gender: { type: "string", required: false },
      isOnboarded: { type: "boolean", required: false, defaultValue: false },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const body = ctx.body as { email?: string; password: string };
        const email = body?.email || "";
        const password = body?.password || "";

        if (email && !email.includes("@")) {
          const identifier = normalizePhone(email) || email.toLowerCase();
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: { equals: identifier, mode: "insensitive" } },
                { phone: identifier },
              ],
            },
          });
          if (user?.email) {
            return { context: { body: { email: user.email, password } } };
          }
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const customData = user as Record<string, unknown>;
          const phone = normalizePhone((customData.phone as string) || null);

          const gender = (customData.gender as string) || null;

      await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: (customData.name as string) || "",
              firstName: (customData.firstName as string) || "",
              lastName: (customData.lastName as string) || "",
              phone,
              username: (customData.username as string) || null,
              gender,
            },
            create: {
              id: user.id,
              email: user.email,
              name: (customData.name as string) || "",
              firstName: (customData.firstName as string) || "",
              lastName: (customData.lastName as string) || "",
              phone,
              username: (customData.username as string) || null,
              gender,
              isOnboarded: false,
            },
          });
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  experimental: {
    useSessionQuery: true
  },
  rateLimit: {
    window: 60,
    max: 20,
  },
});
