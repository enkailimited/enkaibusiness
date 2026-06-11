const COUNTRY_CODE = "255";

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  if (!digits) return null;

  // If starts with "0", replace with country code
  if (digits.startsWith("0")) {
    return COUNTRY_CODE + digits.slice(1);
  }

  // If already starts with country code, return as-is
  if (digits.startsWith(COUNTRY_CODE)) {
    return digits;
  }

  // If starts with "00" (international prefix), strip to country code
  if (digits.startsWith("00")) {
    const rest = digits.slice(2);
    if (rest.startsWith(COUNTRY_CODE)) return rest;
    return rest;
  }

  // Otherwise, assume it already has a country code or is a local number
  return digits;
}
