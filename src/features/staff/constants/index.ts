export const ASSIGNMENT_LEVELS = ["business", "branch", "store"] as const;

export const DEFAULT_POSITIONS = [
  "Cashier",
  "Sales Associate",
  "Store Manager",
  "Branch Manager",
  "Accountant",
  "Inventory Clerk",
  "Pharmacist",
  "Doctor",
  "Nurse",
  "Chef",
  "Waiter",
  "Security",
  "Cleaner",
  "Driver",
] as const;

export const STAFF_SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "Date Added", value: "createdAt" },
  { label: "Position", value: "position" },
] as const;
