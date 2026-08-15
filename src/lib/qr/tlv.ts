import type { QRField } from "./types";

/**
 * Parseur TLV (ID de 2 chiffres, longueur de 2 chiffres, valeur) utilisé par EMVCo MPM.
 * Ne fait AUCUNE hypothèse sur le contenu : il échoue proprement si la structure est invalide.
 */
export function parseTLV(payload: string): QRField[] | null {
  const fields: QRField[] = [];
  let i = 0;
  if (payload.length < 4) return null;
  while (i < payload.length) {
    if (i + 4 > payload.length) return null;
    const id = payload.slice(i, i + 2);
    const lenStr = payload.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lenStr)) return null;
    const len = Number(lenStr);
    const start = i + 4;
    const end = start + len;
    if (end > payload.length) return null;
    fields.push({ id, value: payload.slice(start, end) });
    i = end;
  }
  return fields;
}

/** Parse les sous-champs d'un template (ex: 26-51, 62, 64). Retourne null si non TLV. */
export function parseTemplate(value: string): QRField[] | null {
  return parseTLV(value);
}

export function serializeField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  if (value.length > 99) throw new Error("TLV value too long");
  return `${id}${len}${value}`;
}

export function serializeTLV(fields: QRField[]): string {
  return fields.map((f) => serializeField(f.id, f.value)).join("");
}

export function findField(fields: QRField[], id: string): QRField | undefined {
  return fields.find((f) => f.id === id);
}

/** Insère ou remplace un champ en respectant l'ordre croissant des IDs. */
export function upsertField(fields: QRField[], id: string, value: string): QRField[] {
  const next = fields.filter((f) => f.id !== id);
  const idx = next.findIndex((f) => Number(f.id) > Number(id));
  const field = { id, value };
  if (idx === -1) next.push(field);
  else next.splice(idx, 0, field);
  return next;
}

export function removeField(fields: QRField[], id: string): QRField[] {
  return fields.filter((f) => f.id !== id);
}
