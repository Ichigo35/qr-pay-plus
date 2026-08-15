import { crc16ccittHex } from "../crc";
import { detectBank } from "../banks";
import { currencyFromNumericCode } from "../currency";
import { findField, parseTemplate, parseTLV, serializeTLV, upsertField } from "../tlv";
import type { BankAdapter, InjectResult, ParseResult, QRData, QRField } from "../types";

/** Tags EMVCo Merchant-Presented QR (EMV QRCPS 1.1) */
const TAG = {
  PAYLOAD_FORMAT: "00",
  POINT_OF_INITIATION: "01",
  MCC: "52",
  CURRENCY: "53",
  AMOUNT: "54",
  COUNTRY: "58",
  MERCHANT_NAME: "59",
  MERCHANT_CITY: "60",
  ADDITIONAL_DATA: "62",
  CRC: "63",
} as const;

const MERCHANT_ACCOUNT_RANGE = { min: 2, max: 51 };
const AMOUNT_MAX_LENGTH = 13;

function isMerchantAccountTag(id: string): boolean {
  const n = Number(id);
  return n >= MERCHANT_ACCOUNT_RANGE.min && n <= MERCHANT_ACCOUNT_RANGE.max;
}

/** Vérifie le CRC en fin de payload (les 4 derniers caractères, précédés de "6304"). */
export function verifyChecksum(raw: string): boolean {
  const idx = raw.lastIndexOf("6304");
  if (idx === -1 || idx !== raw.length - 8) return false;
  const expected = crc16ccittHex(raw.slice(0, idx + 4));
  return expected === raw.slice(idx + 4).toUpperCase();
}

/** Reconstruit le payload complet en recalculant le CRC (tag 63). */
export function buildWithChecksum(fields: QRField[]): string {
  const withoutCrc = fields.filter((f) => f.id !== TAG.CRC);
  const base = serializeTLV(withoutCrc) + "6304";
  return base + crc16ccittHex(base);
}

function detect(raw: string): boolean {
  if (!raw || raw.length < 12 || raw.length > 1024) return false;
  if (!raw.startsWith("000201") && !raw.startsWith("0002")) return false;
  const fields = parseTLV(raw);
  if (!fields) return false;
  const format = findField(fields, TAG.PAYLOAD_FORMAT);
  return Boolean(format && /^\d{2}$/.test(format.value) && findField(fields, TAG.CRC));
}

function parse(raw: string): ParseResult {
  const fields = parseTLV(raw);
  if (!fields) {
    return { ok: false, reason: "invalid-structure", message: "Structure TLV invalide." };
  }
  const crc = findField(fields, TAG.CRC);
  if (!crc || crc.value.length !== 4) {
    return { ok: false, reason: "invalid-structure", message: "Checksum absent." };
  }
  if (!verifyChecksum(raw)) {
    return { ok: false, reason: "invalid-checksum", message: "Checksum invalide." };
  }

  const merchantAccounts = fields.filter((f) => isMerchantAccountTag(f.id));
  if (merchantAccounts.length === 0) {
    return {
      ok: false,
      reason: "unknown-format",
      message: "Aucune information de bénéficiaire trouvée.",
    };
  }

  // Indices de banque : uniquement ce qui est réellement présent dans le payload.
  const hints: string[] = [];
  let merchantId: string | null = null;
  for (const acc of merchantAccounts) {
    const sub = parseTemplate(acc.value);
    if (sub && sub.length > 0) {
      acc.children = sub;
      for (const s of sub) {
        hints.push(s.value);
        if (!merchantId && s.id !== "00" && /^[A-Za-z0-9.\-_/]{4,}$/.test(s.value)) {
          merchantId = s.value;
        }
      }
    } else {
      hints.push(acc.value);
      if (!merchantId) merchantId = acc.value;
    }
  }

  const merchantName = findField(fields, TAG.MERCHANT_NAME)?.value ?? null;
  const currencyCode = findField(fields, TAG.CURRENCY)?.value ?? null;
  const amountRaw = findField(fields, TAG.AMOUNT)?.value ?? null;
  const amount = amountRaw !== null && /^\d+(\.\d+)?$/.test(amountRaw) ? Number(amountRaw) : null;

  const additionalData: Record<string, string> = {};
  const additional = findField(fields, TAG.ADDITIONAL_DATA);
  if (additional) {
    const sub = parseTemplate(additional.value);
    if (sub) for (const s of sub) additionalData[s.id] = s.value;
  }

  const data: QRData = {
    rawPayload: raw,
    format: "emvco-mpm",
    adapterId: "emvco-mpm",
    bank: detectBank([...hints, merchantName ?? ""]),
    merchantName,
    merchantId,
    merchantCity: findField(fields, TAG.MERCHANT_CITY)?.value ?? null,
    currencyCode,
    currency: currencyFromNumericCode(currencyCode),
    amount,
    supportsAmountInjection: true,
    fields,
    additionalData,
  };
  return { ok: true, data };
}

function injectAmount(raw: string, amount: number): InjectResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Le montant doit être strictement positif." };
  }
  const parsed = parse(raw);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  // LAK (418) et devises sans décimales -> entier. Sinon 2 décimales.
  const code = parsed.data.currencyCode;
  const zeroDecimal = code === null || code === "418";
  const value = zeroDecimal ? String(Math.round(amount)) : amount.toFixed(2);
  if (value.length > AMOUNT_MAX_LENGTH) {
    return { ok: false, message: "Montant trop élevé pour ce format de QR." };
  }

  let fields = parsed.data.fields.map((f) => ({ id: f.id, value: f.value }));
  fields = upsertField(fields, TAG.AMOUNT, value);
  // QR dynamique : usage unique avec montant.
  fields = upsertField(fields, TAG.POINT_OF_INITIATION, "12");

  try {
    return { ok: true, payload: buildWithChecksum(fields) };
  } catch {
    return { ok: false, message: "Reconstruction du payload impossible." };
  }
}

export const emvcoAdapter: BankAdapter = {
  id: "emvco-mpm",
  label: "EMVCo Merchant-Presented QR",
  format: "emvco-mpm",
  detect,
  parse,
  validate: (raw) => detect(raw) && verifyChecksum(raw) && parse(raw).ok,
  injectAmount,
};

export { TAG as EMVCO_TAGS };
