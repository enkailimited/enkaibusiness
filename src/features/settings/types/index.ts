export type SettingValue = string | number | boolean | Record<string, unknown>;

export type SettingType = "string" | "number" | "boolean" | "json";

export type SettingCategory = "business" | "tax" | "receipt" | "numbering" | "payment" | "user";

export interface Setting {
  id: string;
  businessId: string | null;
  userId: string | null;
  key: string;
  value: string;
  type: SettingType;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingWithParsedValue extends Omit<Setting, "value"> {
  value: SettingValue;
}

export interface SettingCategoryInfo {
  id: SettingCategory;
  label: string;
  description: string;
}

export interface BusinessProfileSettings {
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  city?: string;
  logoUrl?: string;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
}

export interface TaxSettings {
  taxRate?: number;
  taxName?: string;
  tin?: string;
  isVATRegistered?: boolean;
  vatRate?: number;
}

export interface ReceiptSettings {
  header?: string;
  footer?: string;
  showLogo?: boolean;
  showTax?: boolean;
  showDiscount?: boolean;
  showCustomerInfo?: boolean;
  paperSize?: string;
}

export interface NumberingSettings {
  invoicePrefix?: string;
  purchasePrefix?: string;
  receiptPrefix?: string;
  quotationPrefix?: string;
  creditNotePrefix?: string;
  invoiceLastNumber?: number;
  purchaseLastNumber?: number;
  receiptLastNumber?: number;
  quotationLastNumber?: number;
  creditNoteLastNumber?: number;
}

export interface PaymentSettings {
  defaultPaymentMethod?: string;
  defaultPaymentTerms?: string;
  paymentDueDays?: number;
  acceptedCurrencies?: string[];
}

export interface UserPreferences {
  language?: string;
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  timezone?: string;
}
