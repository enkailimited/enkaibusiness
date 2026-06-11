export const SETTING_CATEGORIES = [
  { id: "business", label: "Business", description: "Business profile information" },
  { id: "tax", label: "Tax", description: "Tax configuration and rates" },
  { id: "receipt", label: "Receipt", description: "Receipt display preferences" },
  { id: "numbering", label: "Numbering", description: "Document number prefixes" },
  { id: "payment", label: "Payment", description: "Default payment settings" },
  { id: "user", label: "User", description: "User preferences" },
] as const;

export const BUSINESS_SETTING_KEYS = {
  businessName: "business.businessName",
  businessPhone: "business.businessPhone",
  businessEmail: "business.businessEmail",
  businessAddress: "business.businessAddress",
  city: "business.city",
  logoUrl: "business.logoUrl",
  currency: "business.currency",
  timezone: "business.timezone",
  dateFormat: "business.dateFormat",
} as const;

export const TAX_SETTING_KEYS = {
  taxRate: "tax.taxRate",
  taxName: "tax.taxName",
  tin: "tax.tin",
  isVATRegistered: "tax.isVATRegistered",
  vatRate: "tax.vatRate",
} as const;

export const RECEIPT_SETTING_KEYS = {
  header: "receipt.header",
  footer: "receipt.footer",
  showLogo: "receipt.showLogo",
  showTax: "receipt.showTax",
  showDiscount: "receipt.showDiscount",
  showCustomerInfo: "receipt.showCustomerInfo",
  paperSize: "receipt.paperSize",
} as const;

export const NUMBERING_SETTING_KEYS = {
  invoicePrefix: "numbering.invoicePrefix",
  purchasePrefix: "numbering.purchasePrefix",
  receiptPrefix: "numbering.receiptPrefix",
  quotationPrefix: "numbering.quotationPrefix",
  creditNotePrefix: "numbering.creditNotePrefix",
  invoiceLastNumber: "numbering.invoiceLastNumber",
  purchaseLastNumber: "numbering.purchaseLastNumber",
  receiptLastNumber: "numbering.receiptLastNumber",
  quotationLastNumber: "numbering.quotationLastNumber",
  creditNoteLastNumber: "numbering.creditNoteLastNumber",
} as const;

export const PAYMENT_SETTING_KEYS = {
  defaultPaymentMethod: "payment.defaultPaymentMethod",
  defaultPaymentTerms: "payment.defaultPaymentTerms",
  paymentDueDays: "payment.paymentDueDays",
  acceptedCurrencies: "payment.acceptedCurrencies",
} as const;

export const USER_SETTING_KEYS = {
  language: "user.language",
  theme: "user.theme",
  notifications: "user.notifications",
  emailNotifications: "user.emailNotifications",
  smsNotifications: "user.smsNotifications",
  timezone: "user.timezone",
} as const;

export const SETTING_CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  tax: "Tax",
  receipt: "Receipt",
  numbering: "Numbering",
  payment: "Payment",
  user: "User",
};
