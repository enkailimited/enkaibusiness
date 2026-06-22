export const COMMERCE_BASE_PRICE_PER_DAY = 300;

export const QR_CODE_STICKER_COUNT = 50;
export const QR_CODE_STICKER_PRICE = 1500;
export const QR_CODE_PRINTING_TOTAL = QR_CODE_STICKER_COUNT * QR_CODE_STICKER_PRICE;

export const SETUP_FEE_WHOLESALE = 80000;
export const SETUP_FEE_BOTH = 100000;

export const BUSINESS_SIZE_MULTIPLIERS: Record<string, number> = {
  small: 1,
  medium: 1.5,
  large: 2,
};

export const BUSINESS_SIZE_LABELS: Record<string, string> = {
  small: "Small (1-5 employees)",
  medium: "Medium (6-20 employees)",
  large: "Large (21+ employees)",
};

export const BUSINESS_SIZE_LABELS_SW: Record<string, string> = {
  small: "Ndogo (wafanyakazi 1-5)",
  medium: "Kati (wafanyakazi 6-20)",
  large: "Kubwa (wafanyakazi 21+)",
};

export function calculateDailyPrice(
  basePrice: number,
  businessSize: string = "small",
  qrOrderingEnabled: boolean = false,
): number {
  const multiplier = BUSINESS_SIZE_MULTIPLIERS[businessSize] ?? 1;
  let price = basePrice * multiplier;
  if (qrOrderingEnabled) {
    price = price * 1.2;
  }
  return Math.round(price);
}

export function calculateSetupFee(
  qrOrderingEnabled: boolean = false,
  businessModes?: string[],
): { setupFee: number; qrPrintingFee: number; total: number } {
  let baseFee: number;
  if (!businessModes || businessModes.length === 0) {
    baseFee = SETUP_FEE_WHOLESALE;
  } else if (businessModes.includes("both") || businessModes.includes("retail")) {
    baseFee = SETUP_FEE_BOTH;
  } else {
    baseFee = SETUP_FEE_WHOLESALE;
  }

  const qrPrintingFee = qrOrderingEnabled ? QR_CODE_PRINTING_TOTAL : 0;

  return {
    setupFee: baseFee,
    qrPrintingFee,
    total: baseFee + qrPrintingFee,
  };
}

export function calculateWeeklyPrice(dailyPrice: number): number {
  return dailyPrice * 7;
}

export function calculateMonthlyPrice(dailyPrice: number): number {
  return dailyPrice * 30;
}
