import "server-only";

export type PriceType =
  | "retail" | "wholesale" | "distributor" | "vip" | "dealer"
  | "contract" | "government" | "promotional"
  | "customer-specific" | "volume" | "tier"
  | "time-based" | "campaign" | "location" | "branch" | "currency";

export type UoMType = "count" | "weight" | "volume" | "length";

export type CustomerSegment =
  | "retail" | "wholesale" | "distributor" | "dealer" | "vip"
  | "corporate" | "government" | "export" | "ngo" | "institution";

export type InventoryStrategy = "retail" | "wholesale" | "distribution" | "hybrid";

export type TaxType =
  | "vat" | "gst" | "sales-tax" | "service-tax" | "excise"
  | "withholding" | "import-duty" | "export-tax";

export type TaxMode = "inclusive" | "exclusive";

export type PromotionType =
  | "discount-percent" | "discount-amount" | "buy-x-get-y"
  | "free-item" | "coupon" | "promo-code" | "bundle"
  | "seasonal" | "happy-hour" | "customer-specific";

export type OrderStatus =
  | "draft" | "quotation" | "confirmed" | "processing"
  | "packed" | "shipped" | "delivered" | "invoiced"
  | "paid" | "partially-paid" | "partially-delivered"
  | "backordered" | "cancelled" | "refunded" | "returned";

export type ProcurementStatus =
  | "draft" | "requested" | "rfq-sent" | "quotation-received"
  | "approved" | "ordered" | "partially-received"
  | "fully-received" | "invoiced" | "paid" | "cancelled";

export interface PriceResult {
  unitPrice: number;
  priceType: PriceType;
  priceListId?: string;
  priceListItemId?: string;
  discount?: number;
  discountPercent?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  currency: string;
}

export interface UoMConversion {
  fromUnitId: string;
  toUnitId: string;
  factor: number;
  fromUnitName: string;
  toUnitName: string;
}

export interface InventoryResult {
  catalogItemId: string;
  locationId: string;
  quantityOnHand: number;
  quantityAvailable: number;
  quantityCommitted: number;
  reorderPoint: number;
  maxStock: number;
  unitCost: number;
  totalValue: number;
}

export interface TaxLine {
  type: TaxType;
  name: string;
  rate: number;
  amount: number;
  taxableAmount: number;
  isCompound: boolean;
}

export interface TaxCalculation {
  lines: TaxLine[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  taxMode: TaxMode;
}

export interface PromotionResult {
  promotionId: string;
  name: string;
  type: PromotionType;
  discountAmount: number;
  discountPercent: number;
  priority: number;
  stackable: boolean;
}
