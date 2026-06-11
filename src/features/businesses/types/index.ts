import type { Business, BusinessMode, Industry } from "@/types/models";

export type { Business, BusinessMode, Industry };

export interface BusinessWithModes extends Business {
  modes: BusinessMode[];
}

export interface BusinessWithRelations extends Business {
  modes: BusinessMode[];
  _count?: { branches: number };
}

export type BusinessIndustry = Industry;
