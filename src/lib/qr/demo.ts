import { crc16ccittHex } from "./crc";

/**
 * QR de DÉMONSTRATION — données 100% fictives.
 * Aucun compte, aucune banque réelle, aucune information bancaire véritable.
 */
function build(fieldsWithoutCrc: string): string {
  const base = `${fieldsWithoutCrc}6304`;
  return base + crc16ccittHex(base);
}

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

export interface DemoQR {
  name: string;
  payload: string;
}

const demoMerchant = (guid: string, account: string) =>
  tlv("29", tlv("00", guid) + tlv("01", account));

export const DEMO_QRS: DemoQR[] = [
  {
    name: "DEMO – Restaurant Jimmy",
    payload: build(
      tlv("00", "01") +
        tlv("01", "11") +
        demoMerchant("LAO.BCEL.DEMO", "0000000000000000") +
        tlv("52", "5812") +
        tlv("53", "418") +
        tlv("58", "LA") +
        tlv("59", "DEMO RESTAURANT JIMMY") +
        tlv("60", "VIENTIANE"),
    ),
  },
  {
    name: "DEMO – Ma boutique",
    payload: build(
      tlv("00", "01") +
        tlv("01", "11") +
        demoMerchant("LAO.JDB.DEMO", "1111111111111111") +
        tlv("52", "5311") +
        tlv("53", "418") +
        tlv("58", "LA") +
        tlv("59", "DEMO MA BOUTIQUE") +
        tlv("60", "LUANGPRABANG"),
    ),
  },
  {
    name: "DEMO – Café",
    payload: build(
      tlv("00", "01") +
        tlv("01", "11") +
        demoMerchant("LAO.LDB.DEMO", "2222222222222222") +
        tlv("53", "418") +
        tlv("58", "LA") +
        tlv("59", "DEMO CAFE") +
        tlv("60", "PAKSE"),
    ),
  },
];

/** QR lisible mais non compatible (format non-paiement) pour tester le refus propre. */
export const DEMO_UNSUPPORTED_QR = "https://example.la/not-a-payment-qr";
