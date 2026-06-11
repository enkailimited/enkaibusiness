export interface UnitWithCount {
  id: string;
  businessId: string;
  name: string;
  abbreviation: string;
  type: string;
  isBase: boolean;
  _count: { catalogItems: number };
}

export type UnitType = "count" | "weight" | "volume" | "length";

export interface CreateUnitInput {
  name: string;
  abbreviation: string;
  type: UnitType;
  isBase?: boolean;
}

export interface UpdateUnitInput {
  name?: string;
  abbreviation?: string;
  type?: UnitType;
  isBase?: boolean;
}
