/**
 * Liste CONFIGURABLE des banques / réseaux du Laos.
 *
 * IMPORTANT : aucune logique de parsing spécifique à une banque n'est implémentée ici.
 * La détection se fait uniquement à partir d'indices réellement présents dans le
 * contenu du QR (identifiants de schéma dans les templates 26-51, ou nom du marchand).
 * Si aucun indice fiable n'existe, la banque reste inconnue — ce n'est pas bloquant.
 */
export interface BankProfile {
  id: string;
  label: string;
  /** Fragments d'identifiants (AID / reverse-domain / GUID) réellement observés dans le payload */
  hints: string[];
}

export const LAO_BANKS: BankProfile[] = [
  { id: "bcel", label: "BCEL", hints: ["BCEL", "MBCEL", "LAO.BCEL"] },
  { id: "jdb", label: "JDB Bank", hints: ["JDB", "LAO.JDB"] },
  { id: "lvb", label: "LaoVietBank", hints: ["LAOVIET", "LVB"] },
  { id: "ldb", label: "LDB", hints: ["LDB", "LAO.LDB"] },
  { id: "apb", label: "APB", hints: ["APB", "AGRICULTURE"] },
  { id: "indochina", label: "Indochina Bank", hints: ["INDOCHINA", "ICBL"] },
  { id: "bic", label: "BIC Bank Lao", hints: ["BICLAO", "BIC"] },
  { id: "laoqr", label: "Lao National QR", hints: ["LAOQR", "LAPNET", "NATIONALQR"] },
];

/** Détecte une banque à partir de chaînes extraites du payload (identifiants, nom marchand). */
export function detectBank(candidates: string[]): string | null {
  const haystack = candidates
    .filter(Boolean)
    .map((c) => c.toUpperCase())
    .join(" | ");
  if (!haystack) return null;
  let best: { label: string; len: number } | null = null;
  for (const bank of LAO_BANKS) {
    for (const hint of bank.hints) {
      if (haystack.includes(hint) && (!best || hint.length > best.len)) {
        best = { label: bank.label, len: hint.length };
      }
    }
  }
  return best?.label ?? null;
}
