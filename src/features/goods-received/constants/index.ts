export const GOODS_RECEIVED_REFERENCE_PREFIX = "GR";

export function generateReference(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const ts = Date.now().toString().slice(-6);
  return `${GOODS_RECEIVED_REFERENCE_PREFIX}-${year}${month}-${ts}`;
}
