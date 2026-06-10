export const APP_NAME = "Enkai Business";
export const APP_DESCRIPTION = "Intelligent business operating platform for Africa and emerging markets";
export const APP_VERSION = "0.1.0";

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const IMAGEKIT = {
  DEFAULT_FOLDER: "/uploads",
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;

export const INDUSTRY_MODES_MAP: Record<string, string[]> = {
  COMMERCE: ["RETAIL", "WHOLESALE"],
  HEALTHCARE: ["PHARMACY", "CLINIC", "HOSPITAL"],
  RESTAURANT: ["RESTAURANT", "CAFE", "BAKERY"],
  MANUFACTURING: ["GENERAL"],
  AGRICULTURE: ["GENERAL"],
  SERVICES: ["GENERAL"],
} as const;
