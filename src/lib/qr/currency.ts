/** Codes ISO 4217 numériques -> alphabétiques (limité aux devises utiles ici). */
const NUMERIC_TO_ALPHA: Record<string, string> = {
  "418": "LAK",
  "764": "THB",
  "840": "USD",
  "978": "EUR",
  "704": "VND",
  "156": "CNY",
};

export function currencyFromNumericCode(code: string | null): string | null {
  if (!code) return null;
  return NUMERIC_TO_ALPHA[code] ?? code;
}

export const MAX_AMOUNT = 9_999_999_999;

/** 100000 -> "100 000" */
export function formatAmount(value: number | string): string {
  const n = typeof value === "string" ? Number(value.replace(/\D/g, "")) : value;
  if (!Number.isFinite(n)) return "0";
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
}

export function formatKip(value: number): string {
  return `${formatAmount(value)} ₭`;
}

export interface AmountValidation {
  ok: boolean;
  error?: "empty" | "not-positive" | "too-large" | "invalid";
}

export function validateAmount(value: number): AmountValidation {
  if (!Number.isFinite(value)) return { ok: false, error: "invalid" };
  if (value === 0) return { ok: false, error: "empty" };
  if (value < 0) return { ok: false, error: "not-positive" };
  if (!Number.isInteger(value)) return { ok: false, error: "invalid" };
  if (value > MAX_AMOUNT) return { ok: false, error: "too-large" };
  return { ok: true };
}

/** N'accepte que des chiffres, retourne la valeur numérique. */
export function sanitizeAmountInput(input: string): number {
  const digits = input.replace(/\D/g, "").slice(0, 12);
  return digits ? Number(digits) : 0;
}
