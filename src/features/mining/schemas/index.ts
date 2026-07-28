import { z } from "zod";

export const miningSiteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  location: z.string().optional(),
  coordinates: z.string().optional(),
  size: z.coerce.number().positive().optional(),
  sizeUnit: z.string().optional(),
  mineralType: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DEPLETED", "ON_HOLD"]).default("ACTIVE"),
  description: z.string().optional(),
});

export const miningSiteFilterSchema = z.object({
  status: z.string().optional(),
  mineralType: z.string().optional(),
  search: z.string().optional(),
});

export const miningLicenseSchema = z.object({
  siteId: z.string().uuid().optional().nullable(),
  licenseNumber: z.string().min(1, "License number is required"),
  type: z.string().min(1, "License type is required"),
  issuingBody: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING", "EXPIRED", "REVOKED"]).default("PENDING"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().optional(),
  description: z.string().optional(),
  documentUrl: z.string().optional(),
});

export const miningEquipmentSchema = z.object({
  siteId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Equipment name is required"),
  equipmentType: z.string().min(1, "Equipment type is required"),
  make: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  year: z.coerce.number().int().optional(),
  status: z.enum(["OPERATIONAL", "MAINTENANCE", "REPAIR", "RETIRED"]).default("OPERATIONAL"),
  purchaseDate: z.string().optional(),
  purchasePrice: z.coerce.number().positive().optional(),
  fuelType: z.enum(["DIESEL", "PETROL", "LUBRICANT", "GREASE"]).default("DIESEL"),
  fuelCapacity: z.coerce.number().positive().optional(),
  hourlyFuelUsage: z.coerce.number().positive().optional(),
  lastMaintenance: z.string().optional(),
  nextMaintenance: z.string().optional(),
  meterReading: z.coerce.number().optional(),
  meterUnit: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const fuelTransactionSchema = z.object({
  siteId: z.string().uuid().optional().nullable(),
  equipmentId: z.string().uuid().optional().nullable(),
  fuelType: z.enum(["DIESEL", "PETROL", "LUBRICANT", "GREASE"]).default("DIESEL"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitCost: z.coerce.number().positive().optional(),
  totalCost: z.coerce.number().positive().optional(),
  supplier: z.string().optional(),
  receiptRef: z.string().optional(),
  transactionDate: z.string().default(() => new Date().toISOString()),
  notes: z.string().optional(),
});

export const miningProductionLogSchema = z.object({
  siteId: z.string().uuid().optional().nullable(),
  catalogItemId: z.string().uuid().optional().nullable(),
  productionDate: z.string().min(1, "Production date is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().default("tonnes"),
  grade: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
});

export const miningServiceLogSchema = z.object({
  equipmentId: z.string().uuid().min(1, "Equipment is required"),
  serviceType: z.string().min(1, "Service type is required"),
  description: z.string().optional(),
  serviceDate: z.string().min(1, "Service date is required"),
  cost: z.coerce.number().positive().optional(),
  meterAtService: z.coerce.number().optional(),
  nextServiceDate: z.string().optional(),
  nextServiceMeter: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export type MiningSiteInput = z.infer<typeof miningSiteSchema>;
export type MiningLicenseInput = z.infer<typeof miningLicenseSchema>;
export type MiningEquipmentInput = z.infer<typeof miningEquipmentSchema>;
export type FuelTransactionInput = z.infer<typeof fuelTransactionSchema>;
export type MiningProductionLogInput = z.infer<typeof miningProductionLogSchema>;
export type MiningServiceLogInput = z.infer<typeof miningServiceLogSchema>;
