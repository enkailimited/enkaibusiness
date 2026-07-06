import "server-only";
import { prisma } from "@/server/db";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: "exact" | "partial" | "none";
  matches: Array<{ id: string; firstName: string; lastName: string; email: string | null; phone: string | null; status: string; businessName: string | null }>;
}

export async function checkLeadDuplicates(
  email?: string | null,
  phone?: string | null,
  firstName?: string,
  lastName?: string,
  excludeId?: string,
): Promise<DuplicateCheckResult> {
  if (!email && !phone && !firstName && !lastName) {
    return { isDuplicate: false, confidence: "none", matches: [] };
  }

  const conditions: Record<string, unknown>[] = [];

  if (email) {
    conditions.push({ email: { equals: email, mode: "insensitive" } });
  }
  if (phone) {
    conditions.push({ phone });
  }
  if (firstName && lastName) {
    conditions.push({
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    });
  }

  if (conditions.length === 0) {
    return { isDuplicate: false, confidence: "none", matches: [] };
  }

  const where: Record<string, unknown> = { OR: conditions };
  if (excludeId) where.id = { not: excludeId };

  const matches = await prisma.lead.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true, businessName: true },
  });

  if (matches.length === 0) {
    return { isDuplicate: false, confidence: "none", matches: [] };
  }

  const exactMatch = matches.find((m) => {
    const sameEmail = email && m.email && m.email.toLowerCase() === email.toLowerCase();
    const samePhone = phone && m.phone === phone;
    const sameName = firstName && lastName && m.firstName.toLowerCase() === firstName.toLowerCase() && m.lastName.toLowerCase() === lastName.toLowerCase();
    return sameEmail || samePhone;
  });

  return {
    isDuplicate: !!exactMatch,
    confidence: exactMatch ? "exact" : "partial",
    matches,
  };
}
