import "server-only";
import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import type {
  CreatePackageSchema,
  UpdatePackageSchema,
  AssignPackageTicketSchema,
  CalculatePriceSchema,
} from "../schemas";

export async function getPackages(industry?: string, businessModeId?: string) {
  const where: Record<string, unknown> = {};

  if (industry) {
    where.industries = { array_contains: industry };
  }

  if (businessModeId) {
    where.supportedModes = { array_contains: businessModeId };
  }

  return prisma.installationPackage.findMany({
    where: where as any,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPackage(id: string) {
  return prisma.installationPackage.findUnique({
    where: { id },
    include: {
      _count: { select: { installationTickets: true } },
    },
  });
}

export async function createPackage(data: CreatePackageSchema) {
  const decimalKeys = new Set([
    "baseFee", "pricePerBranch", "pricePerQRCode",
    "pricePerTrainingHour", "brandingFee", "printerFee", "price",
  ]);

  const createData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (decimalKeys.has(key) && value !== undefined) {
      createData[key] = new Prisma.Decimal(value as number);
    } else {
      createData[key] = value;
    }
  }

  return prisma.installationPackage.create({
    data: createData as any,
  });
}

export async function updatePackage(id: string, data: UpdatePackageSchema) {
  const decimalFields = [
    "baseFee", "pricePerBranch", "pricePerQRCode",
    "pricePerTrainingHour", "brandingFee", "printerFee", "price",
  ] as const;

  const updateData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if ((decimalFields as readonly string[]).includes(key) && value !== undefined) {
      updateData[key] = new Prisma.Decimal(value as number);
    } else {
      updateData[key] = value;
    }
  }

  return prisma.installationPackage.update({
    where: { id },
    data: updateData as any,
  });
}

export async function deletePackage(id: string) {
  const inUse = await prisma.installationTicketPackage.count({
    where: { packageId: id },
  });
  if (inUse > 0) {
    return { success: false, message: "Cannot delete package assigned to active tickets" };
  }

  await prisma.installationPackage.delete({ where: { id } });
  return { success: true, message: "Package deleted" };
}

export async function togglePackageStatus(id: string) {
  const pkg = await prisma.installationPackage.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!pkg) return { success: false, message: "Package not found" };

  const newStatus = pkg.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.installationPackage.update({
    where: { id },
    data: { status: newStatus },
  });

  return { success: true, message: `Package ${newStatus === "ACTIVE" ? "activated" : "deactivated"}` };
}

export interface PriceBreakdown {
  baseFee: number;
  branchCost: number;
  qrCost: number;
  trainingCost: number;
  brandingCost: number;
  printerCost: number;
  marketingKitCost: number;
  verificationCost: number;
  optionalServices: number;
  total: number;
}

export async function calculatePackagePrice(
  packageId: string,
  context: CalculatePriceSchema,
): Promise<{ success: boolean; data?: PriceBreakdown; message?: string }> {
  const pkg = await prisma.installationPackage.findUnique({
    where: { id: packageId },
  });
  if (!pkg) return { success: false, message: "Package not found" };

  const toNumber = (val: unknown): number => {
    if (val instanceof Prisma.Decimal) return val.toNumber();
    if (typeof val === "number") return val;
    return 0;
  };

  const baseFee = toNumber(pkg.baseFee);
  const perBranch = toNumber(pkg.pricePerBranch);
  const perQR = toNumber(pkg.pricePerQRCode);
  const perTrainingHour = toNumber(pkg.pricePerTrainingHour);
  const brandingFee = pkg.brandingIncluded ? 0 : (toNumber(pkg.brandingFee) || 0);
  const printerFee = pkg.printerIncluded ? 0 : (toNumber(pkg.printerFee) || 0);

  const branchCost = perBranch * context.branches;
  const qrCost = perQR * context.qrCodes;
  const trainingCost = perTrainingHour * context.trainingHours;

  let formulaTotal = 0;
  if (pkg.pricingFormula) {
    try {
      const vars: Record<string, number> = {
        base: baseFee,
        branches: context.branches,
        perBranch,
        qr: context.qrCodes,
        perQR,
        training: context.trainingHours,
        perTrainingHour,
        branding: context.includeBranding ? (toNumber(pkg.brandingFee) || 0) : 0,
        printer: context.includePrinter ? (toNumber(pkg.printerFee) || 0) : 0,
      };
      let formula = pkg.pricingFormula;
      for (const [key, val] of Object.entries(vars)) {
        formula = formula.replace(new RegExp(`\\b${key}\\b`, "g"), String(val));
      }
      formulaTotal = Function(`"use strict"; return (${formula})`)();
    } catch {
      formulaTotal = 0;
    }
  }

  const breakdown: PriceBreakdown = {
    baseFee,
    branchCost,
    qrCost,
    trainingCost,
    brandingCost: context.includeBranding ? brandingFee : 0,
    printerCost: context.includePrinter ? printerFee : 0,
    marketingKitCost: context.includeMarketingKit && pkg.marketingKitIncluded ? 0 : 0,
    verificationCost: context.includeVerification && pkg.verificationIncluded ? 0 : 0,
    optionalServices: 0,
    total: 0,
  };

  if (formulaTotal > 0) {
    breakdown.total = formulaTotal;
  } else {
    breakdown.total = baseFee + branchCost + qrCost + trainingCost +
      breakdown.brandingCost + breakdown.printerCost;
  }

  return { success: true, data: breakdown };
}

export async function getPackageForTicket(ticketId: string) {
  return prisma.installationTicketPackage.findUnique({
    where: { ticketId },
    include: { package: true },
  });
}

export async function assignPackageToTicket(
  ticketId: string,
  packageId: string,
  context: AssignPackageTicketSchema,
) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  const priceResult = await calculatePackagePrice(packageId, context);
  if (!priceResult.success || !priceResult.data) {
    return { success: false, message: priceResult.message ?? "Price calculation failed" };
  }

  const existing = await prisma.installationTicketPackage.findUnique({
    where: { ticketId },
  });

  if (existing) {
    await prisma.installationTicketPackage.update({
      where: { ticketId },
      data: {
        packageId,
        calculatedPrice: new Prisma.Decimal(priceResult.data.total),
        pricingBreakdown: priceResult.data as any,
      },
    });
  } else {
    await prisma.installationTicketPackage.create({
      data: {
        ticketId,
        packageId,
        calculatedPrice: new Prisma.Decimal(priceResult.data.total),
        pricingBreakdown: priceResult.data as any,
      },
    });
  }

  await prisma.installationTicket.update({
    where: { id: ticketId },
    data: { packageId },
  });

  return { success: true, message: "Package assigned to ticket", data: priceResult.data };
}

export async function getInstallationServiceTypes() {
  const types = [
    "QR_EXPERIENCE",
    "STOREFRONT",
    "CUSTOMER_APP",
    "DIGITAL_MENU",
    "HEALTHCARE_QUEUE",
    "SCHOOL_PARENT_PORTAL",
    "RESTAURANT_QR_ORDERING",
    "RETAIL_QR_ORDERING",
    "APPOINTMENT_QR",
    "BOOKING_QR",
    "SELF_CHECKIN",
    "KIOSK",
    "DIGITAL_CATALOG",
    "OTHER",
  ] as const;
  return types;
}

export async function addServiceToTicket(ticketId: string, type: string, notes?: string) {
  const ticket = await prisma.installationTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) return { success: false, message: "Ticket not found" };

  const existing = await prisma.installationService.findFirst({
    where: { ticketId, type: type as any },
  });
  if (existing) return { success: false, message: "Service type already added" };

  await prisma.installationService.create({
    data: {
      ticketId,
      type: type as any,
      notes: notes || null,
    },
  });

  return { success: true, message: "Service added to ticket" };
}
