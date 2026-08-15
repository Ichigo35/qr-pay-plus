/**
 * CRC-16/CCITT-FALSE, utilisé par la spécification EMVCo Merchant-Presented QR
 * (polynôme 0x1021, init 0xFFFF, pas de réflexion, pas de XOR final).
 */
export function crc16ccitt(input: string): number {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc & 0xffff;
}

export function crc16ccittHex(input: string): string {
  return crc16ccitt(input).toString(16).toUpperCase().padStart(4, "0");
}
