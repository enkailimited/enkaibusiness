import { z } from "zod";

const installationServiceTypeEnum = z.enum([
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
]);

export const createPackageSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional().or(z.literal("")),
  industries: z.array(z.string()).default([]),
  supportedModes: z.array(z.string()).optional().default([]),
  minBranches: z.coerce.number().int().min(0).optional(),
  maxBranches: z.coerce.number().int().min(0).optional(),
  minQRCodes: z.coerce.number().int().min(0).optional(),
  maxQRCodes: z.coerce.number().int().min(0).optional(),
  trainingHours: z.coerce.number().int().min(0).optional(),
  installationHours: z.coerce.number().int().min(0).optional(),
  brandingIncluded: z.boolean().optional().default(false),
  printerIncluded: z.boolean().optional().default(false),
  marketingKitIncluded: z.boolean().optional().default(false),
  verificationIncluded: z.boolean().optional().default(false),
  supportPeriodDays: z.coerce.number().int().min(0).optional(),
  baseFee: z.coerce.number().min(0).optional(),
  pricePerBranch: z.coerce.number().min(0).optional(),
  pricePerQRCode: z.coerce.number().min(0).optional(),
  pricePerTrainingHour: z.coerce.number().min(0).optional(),
  brandingFee: z.coerce.number().min(0).optional(),
  printerFee: z.coerce.number().min(0).optional(),
  pricingFormula: z.string().optional().or(z.literal("")),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().default("TZS"),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const updatePackageSchema = createPackageSchema.partial();

export const assignPackageTicketSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket ID"),
  packageId: z.string().uuid("Invalid package ID"),
  branches: z.coerce.number().int().min(0).default(0),
  qrCodes: z.coerce.number().int().min(0).default(0),
  trainingHours: z.coerce.number().int().min(0).default(0),
  includeBranding: z.boolean().default(false),
  includePrinter: z.boolean().default(false),
  includeMarketingKit: z.boolean().default(false),
  includeVerification: z.boolean().default(false),
  optionalServices: z.array(z.string()).default([]),
});

export const addServiceToTicketSchema = z.object({
  ticketId: z.string().uuid("Invalid ticket ID"),
  type: installationServiceTypeEnum,
  notes: z.string().optional().or(z.literal("")),
});

export const calculatePriceSchema = z.object({
  packageId: z.string().uuid("Invalid package ID"),
  branches: z.coerce.number().int().min(0).default(0),
  qrCodes: z.coerce.number().int().min(0).default(0),
  trainingHours: z.coerce.number().int().min(0).default(0),
  includeBranding: z.boolean().default(false),
  includePrinter: z.boolean().default(false),
  includeMarketingKit: z.boolean().default(false),
  includeVerification: z.boolean().default(false),
  optionalServices: z.array(z.string()).default([]),
});

export type CreatePackageSchema = z.infer<typeof createPackageSchema>;
export type UpdatePackageSchema = z.infer<typeof updatePackageSchema>;
export type AssignPackageTicketSchema = z.infer<typeof assignPackageTicketSchema>;
export type AddServiceToTicketSchema = z.infer<typeof addServiceToTicketSchema>;
export type CalculatePriceSchema = z.infer<typeof calculatePriceSchema>;
