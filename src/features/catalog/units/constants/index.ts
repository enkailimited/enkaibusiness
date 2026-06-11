export const UNIT_TYPES = ["count", "weight", "volume", "length"] as const;

export const UNIT_TYPE_LABELS: Record<string, string> = {
  count: "Count",
  weight: "Weight",
  volume: "Volume",
  length: "Length",
};

export const UNIT_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  count: "default",
  weight: "secondary",
  volume: "outline",
  length: "destructive",
};

export const UNIT_SORT_OPTIONS = [
  { label: "Name", value: "name" },
  { label: "Type", value: "type" },
  { label: "Date Added", value: "createdAt" },
] as const;

export const DEFAULT_UNITS: Array<{ name: string; abbreviation: string; type: string; isBase: boolean }> = [
  { name: "Piece", abbreviation: "pc", type: "count", isBase: true },
  { name: "Kilogram", abbreviation: "kg", type: "weight", isBase: true },
  { name: "Gram", abbreviation: "g", type: "weight", isBase: false },
  { name: "Liter", abbreviation: "L", type: "volume", isBase: true },
  { name: "Milliliter", abbreviation: "mL", type: "volume", isBase: false },
  { name: "Meter", abbreviation: "m", type: "length", isBase: true },
  { name: "Box", abbreviation: "box", type: "count", isBase: false },
  { name: "Dozen", abbreviation: "dz", type: "count", isBase: false },
];
