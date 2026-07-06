import type { InstallationServiceType } from "@prisma/client";

export const INSTALLATION_TYPE_LABELS: Record<string, string> = {
  NEW_BUSINESS: "New Business",
  NEW_BRANCH: "New Branch",
  UPGRADE: "Upgrade",
  MAINTENANCE: "Maintenance",
  REPLACEMENT: "Replacement",
  REINSTALLATION: "Reinstallation",
};

export const INSTALLATION_TYPE_CATEGORIES: Record<string, string> = {
  NEW_BUSINESS: "onboarding",
  NEW_BRANCH: "expansion",
  UPGRADE: "improvement",
  MAINTENANCE: "support",
  REPLACEMENT: "support",
  REINSTALLATION: "support",
};

export const SERVICE_TYPE_LABELS: Record<InstallationServiceType, string> = {
  QR_EXPERIENCE: "QR Experience",
  STOREFRONT: "Storefront",
  CUSTOMER_APP: "Customer App",
  DIGITAL_MENU: "Digital Menu",
  HEALTHCARE_QUEUE: "Healthcare Queue",
  SCHOOL_PARENT_PORTAL: "School Parent Portal",
  RESTAURANT_QR_ORDERING: "Restaurant QR Ordering",
  RETAIL_QR_ORDERING: "Retail QR Ordering",
  APPOINTMENT_QR: "Appointment QR",
  BOOKING_QR: "Booking QR",
  SELF_CHECKIN: "Self Check-in",
  KIOSK: "Kiosk",
  DIGITAL_CATALOG: "Digital Catalog",
  OTHER: "Other",
};

export const SERVICE_TYPES_REQUIRING_TRAINING: InstallationServiceType[] = [
  "QR_EXPERIENCE",
  "STOREFRONT",
  "CUSTOMER_APP",
  "DIGITAL_MENU",
  "RESTAURANT_QR_ORDERING",
  "RETAIL_QR_ORDERING",
  "KIOSK",
];

export const PACKAGE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
