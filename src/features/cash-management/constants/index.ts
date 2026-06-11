export const REGISTER_TYPES = [
  { value: "main", label: "Main" },
  { value: "petty_cash", label: "Petty Cash" },
  { value: "till", label: "Till" },
] as const;

export const REGISTER_TYPE_LABELS: Record<string, string> = {
  main: "Main",
  petty_cash: "Petty Cash",
  till: "Till",
};

export const REGISTER_TYPE_VARIANTS: Record<string, "default" | "outline" | "secondary"> = {
  main: "default",
  petty_cash: "secondary",
  till: "outline",
};

export const TRANSACTION_TYPES = [
  { value: "cash_in", label: "Cash In" },
  { value: "cash_out", label: "Cash Out" },
  { value: "transfer_in", label: "Transfer In" },
  { value: "transfer_out", label: "Transfer Out" },
  { value: "opening_balance", label: "Opening Balance" },
  { value: "closing_balance", label: "Closing Balance" },
  { value: "cash_count", label: "Cash Count" },
] as const;

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  cash_in: "Cash In",
  cash_out: "Cash Out",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  opening_balance: "Opening Balance",
  closing_balance: "Closing Balance",
  cash_count: "Cash Count",
};

export const TRANSACTION_TYPE_VARIANTS: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  cash_in: "default",
  cash_out: "destructive",
  transfer_in: "outline",
  transfer_out: "secondary",
  opening_balance: "outline",
  closing_balance: "secondary",
  cash_count: "outline",
};

export const DEFAULT_PAGE_SIZE = 20;
