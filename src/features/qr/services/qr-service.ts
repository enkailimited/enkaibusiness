import "server-only";
import { prisma } from "@/server/db";

type QRMode =
  | "COMMERCE_BROWSE" | "COMMERCE_ORDER"
  | "RESTAURANT_MENU" | "RESTAURANT_ORDER" | "RESTAURANT_PAY"
  | "HEALTHCARE_APPOINTMENT" | "HEALTHCARE_QUEUE" | "HEALTHCARE_SERVICES"
  | "EDUCATION_ADMISSIONS" | "EDUCATION_PARENT_PORTAL" | "EDUCATION_ATTENDANCE" | "EDUCATION_FEES" | "EDUCATION_REPORTS"
  | "HOTEL_ROOM_SERVICE" | "HOTEL_CHECKIN" | "HOTEL_HOUSEKEEPING"
  | "MANUFACTURING_MACHINE" | "MANUFACTURING_MAINTENANCE"
  | "AGRICULTURE_FARM" | "AGRICULTURE_EQUIPMENT"
  | "REAL_ESTATE_PROPERTY" | "REAL_ESTATE_VIEWING"
  | "SERVICES_BOOKING"
  | "LOGISTICS_TRACKING"
  | "NON_PROFIT_DONATION"
  | "GENERAL_INFO";

export const QR_MODES_BY_INDUSTRY: Record<string, { value: QRMode; label: string; description: string }[]> = {
  COMMERCE: [
    { value: "COMMERCE_BROWSE", label: "Browse Catalog", description: "Scan to browse products" },
    { value: "COMMERCE_ORDER", label: "Order Online", description: "Scan to place orders" },
  ],
  RESTAURANT: [
    { value: "RESTAURANT_MENU", label: "Digital Menu", description: "Scan to view menu" },
    { value: "RESTAURANT_ORDER", label: "Self Ordering", description: "Scan to order from table" },
    { value: "RESTAURANT_PAY", label: "Pay at Table", description: "Scan to pay bill" },
  ],
  HEALTHCARE: [
    { value: "HEALTHCARE_APPOINTMENT", label: "Book Appointment", description: "Scan to book appointment" },
    { value: "HEALTHCARE_QUEUE", label: "Queue Status", description: "Scan to check queue" },
    { value: "HEALTHCARE_SERVICES", label: "View Services", description: "Scan to view services" },
  ],
  EDUCATION: [
    { value: "EDUCATION_ADMISSIONS", label: "Admissions", description: "Scan to apply" },
    { value: "EDUCATION_PARENT_PORTAL", label: "Parent Portal", description: "Scan for parent dashboard" },
    { value: "EDUCATION_ATTENDANCE", label: "Attendance", description: "Scan to mark attendance" },
    { value: "EDUCATION_FEES", label: "Fee Payment", description: "Scan to pay fees" },
    { value: "EDUCATION_REPORTS", label: "Reports", description: "Scan for student reports" },
  ],
  LOGISTICS: [
    { value: "LOGISTICS_TRACKING", label: "Track Shipment", description: "Scan to track delivery" },
  ],
  REAL_ESTATE: [
    { value: "REAL_ESTATE_PROPERTY", label: "Property Info", description: "Scan for property details" },
    { value: "REAL_ESTATE_VIEWING", label: "Schedule Viewing", description: "Scan to schedule viewing" },
  ],
  SERVICES: [
    { value: "SERVICES_BOOKING", label: "Book Service", description: "Scan to book appointment" },
    { value: "GENERAL_INFO", label: "General Info", description: "Scan for information" },
  ],
  MANUFACTURING: [
    { value: "MANUFACTURING_MACHINE", label: "Machine Info", description: "Scan for machine details" },
    { value: "MANUFACTURING_MAINTENANCE", label: "Maintenance", description: "Scan for maintenance log" },
  ],
  AGRICULTURE: [
    { value: "AGRICULTURE_FARM", label: "Farm Info", description: "Scan for farm details" },
    { value: "AGRICULTURE_EQUIPMENT", label: "Equipment", description: "Scan for equipment info" },
  ],
  NON_PROFIT: [
    { value: "NON_PROFIT_DONATION", label: "Donate", description: "Scan to donate" },
  ],
};

function generateQRCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createQRExperience(data: {
  businessId: string; branchId?: string; label?: string;
  mode: QRMode; destinationUrl?: string;
}) {
  let code = generateQRCode();
  let exists = await prisma.qRExperience.findUnique({ where: { code } });
  while (exists) {
    code = generateQRCode();
    exists = await prisma.qRExperience.findUnique({ where: { code } });
  }

  return prisma.qRExperience.create({
    data: {
      businessId: data.businessId,
      branchId: data.branchId || null,
      code,
      label: data.label || null,
      mode: data.mode as any,
      status: "PENDING_INSTALLATION",
      destinationUrl: data.destinationUrl || null,
    },
    include: {
      business: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getQRExperiences(businessId?: string) {
  const where: Record<string, unknown> = {};
  if (businessId) where.businessId = businessId;

  return prisma.qRExperience.findMany({
    where,
    select: {
      id: true, code: true, label: true, mode: true, status: true,
      scanCount: true, lastScannedAt: true, activatedAt: true,
      createdAt: true,
      business: { select: { id: true, name: true, slug: true } },
      branch: { select: { id: true, name: true } },
      installation: { select: { id: true, installedAt: true, location: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getQRExperienceById(id: string) {
  return prisma.qRExperience.findUnique({
    where: { id },
    include: {
      business: { select: { id: true, name: true, slug: true, currency: true } },
      branch: { select: { id: true, name: true } },
      installation: true,
    },
  });
}

export async function getQRExperienceByCode(code: string) {
  return prisma.qRExperience.findUnique({
    where: { code },
    include: {
      business: {
        select: {
          id: true, name: true, slug: true, currency: true,
          metadata: true,
        },
      },
      branch: { select: { id: true, name: true, address: true } },
    },
  });
}

export async function recordQRScan(experienceId: string) {
  return prisma.qRExperience.update({
    where: { id: experienceId },
    data: {
      scanCount: { increment: 1 },
      lastScannedAt: new Date(),
    },
  });
}

export async function updateQRStatus(id: string, status: string) {
  const updateData: Record<string, unknown> = { status };
  if (status === "ACTIVE") updateData.activatedAt = new Date();
  return prisma.qRExperience.update({ where: { id }, data: updateData });
}

export async function recordQRInstallation(data: {
  experienceId: string; installedBy: string;
  location?: string; material?: string; size?: string; orientation?: string; notes?: string;
}) {
  await prisma.qRExperienceInstallation.create({
    data: {
      experienceId: data.experienceId,
      installedBy: data.installedBy,
      location: data.location || null,
      material: data.material || "vinyl",
      size: data.size || "8cm x 8cm",
      orientation: data.orientation || "portrait",
      notes: data.notes || null,
    },
  });
  return updateQRStatus(data.experienceId, "ACTIVE");
}

export function getModeLabel(mode: string): string {
  const parts = mode.split("_");
  return parts.slice(1).join(" ");
}

export function getIndustryForMode(mode: string): string {
  if (mode.startsWith("COMMERCE")) return "COMMERCE";
  if (mode.startsWith("RESTAURANT")) return "RESTAURANT";
  if (mode.startsWith("HEALTHCARE")) return "HEALTHCARE";
  if (mode.startsWith("EDUCATION")) return "EDUCATION";
  if (mode.startsWith("HOTEL")) return "HOTEL";
  if (mode.startsWith("MANUFACTURING")) return "MANUFACTURING";
  if (mode.startsWith("AGRICULTURE")) return "AGRICULTURE";
  if (mode.startsWith("REAL_ESTATE")) return "REAL_ESTATE";
  if (mode.startsWith("SERVICES")) return "SERVICES";
  if (mode.startsWith("LOGISTICS")) return "LOGISTICS";
  if (mode.startsWith("NON_PROFIT")) return "NON_PROFIT";
  return "COMMERCE";
}
