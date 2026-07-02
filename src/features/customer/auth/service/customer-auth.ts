import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { hashPassword, verifyPassword } from "@better-auth/utils/password";
import { prisma } from "@/server/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || "enkai-customer-dev-secret-change-in-production",
);

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CustomerTokenPayload extends JWTPayload {
  sub: string;
  email?: string;
  phone?: string;
  type: "customer";
}

export async function createCustomerJWT(customerId: string): Promise<{ token: string; refreshToken: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const token = await new SignJWT({ sub: customerId, type: "customer" } as CustomerTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const refreshToken = await new SignJWT({ sub: customerId, type: "customer_refresh" } as CustomerTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  await prisma.customerSession.upsert({
    where: { token },
    update: { refreshToken, expiresAt, lastActivityAt: new Date() },
    create: {
      accountId: customerId,
      token,
      refreshToken,
      expiresAt,
      isActive: true,
      lastActivityAt: new Date(),
    },
  });

  return { token, refreshToken, expiresAt };
}

export async function verifyCustomerJWT(token: string): Promise<CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (payload.type !== "customer") return null;
    return payload as unknown as CustomerTokenPayload;
  } catch {
    return null;
  }
}

export async function requireCustomerAuth(request?: Request): Promise<{ customerId: string }> {
  const token = request
    ? request.headers.get("authorization")?.replace("Bearer ", "")
    : null;

  if (!token) {
    throw new Error("Unauthorized: no token provided");
  }

  const payload = await verifyCustomerJWT(token);
  if (!payload || !payload.sub) {
    throw new Error("Unauthorized: invalid token");
  }

  const session = await prisma.customerSession.findFirst({
    where: { accountId: payload.sub, isActive: true, expiresAt: { gt: new Date() } },
  });

  if (!session) {
    throw new Error("Unauthorized: session expired");
  }

  return { customerId: payload.sub };
}

export async function registerCustomer(data: {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  password: string;
}): Promise<{ customerId: string; token: string; refreshToken: string; expiresAt: Date }> {
  const existing = await prisma.customerAccount.findFirst({
    where: {
      OR: [{ email: data.email }, ...(data.phone ? [{ phone: data.phone }] : [])],
    },
  });

  if (existing) {
    throw new Error("Account already exists with this email or phone");
  }

  const passwordHash = await hashPassword(data.password);

  const customer = await prisma.customerAccount.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName || null,
      phone: data.phone || null,
      passwordHash,
      emailVerified: false,
      source: "SELF_REGISTRATION",
    },
  });

  const session = await createCustomerJWT(customer.id);
  return { customerId: customer.id, ...session };
}

export async function loginCustomer(identifier: string, password: string): Promise<{ customerId: string; token: string; refreshToken: string; expiresAt: Date } | null> {
  const customer = await prisma.customerAccount.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: identifier }],
      status: { not: "SUSPENDED" },
    },
  });

  if (!customer || !customer.passwordHash) return null;

  const valid = await verifyPassword(customer.passwordHash, password).catch(() => false);
  if (!valid) return null;

  await prisma.customerAccount.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() },
  });

  const session = await createCustomerJWT(customer.id);
  return { customerId: customer.id, ...session };
}

export async function getCustomerProfile(customerId: string) {
  return prisma.customerAccount.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      locale: true,
      timezone: true,
      customerType: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
    },
  });
}

export async function logoutCustomer(customerId: string): Promise<void> {
  await prisma.customerSession.updateMany({
    where: { accountId: customerId, isActive: true },
    data: { isActive: false },
  });
}
