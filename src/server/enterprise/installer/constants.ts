import type { InstallerStatus } from "@prisma/client";

export const INSTALLER_STATUS_LABELS: Record<InstallerStatus, string> = {
  AVAILABLE: "Available",
  BUSY: "Busy",
  TRAVELING: "Traveling",
  OFFLINE: "Offline",
  INACTIVE: "Inactive",
};

export const INSTALLER_STATUS_CATEGORIES: Record<string, string> = {
  AVAILABLE: "active",
  BUSY: "active",
  TRAVELING: "active",
  OFFLINE: "inactive",
  INACTIVE: "inactive",
};

export const TRAVEL_STATUS_LABELS: Record<string, string> = {
  en_route: "En Route",
  arrived: "Arrived",
  departed: "Departed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const INSTALLATION_PHOTO_CATEGORIES = [
  "site_visit",
  "qr_installation",
  "training",
  "verification",
  "completion",
  "other",
] as const;

export const CHECKLIST_CATEGORIES = [
  "setup",
  "configuration",
  "catalog",
  "payment",
  "delivery",
  "qr",
  "training",
  "testing",
] as const;
