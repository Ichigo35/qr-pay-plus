import type { BankAdapter } from "../types";
import { emvcoAdapter } from "./emvco";

/**
 * Registre modulaire des adaptateurs.
 * Pour supporter un nouveau standard : créer un fichier adaptateur implémentant
 * BankAdapter puis l'ajouter ici. Aucune autre partie de l'app ne change.
 */
export const adapters: BankAdapter[] = [emvcoAdapter];

export function findAdapter(raw: string): BankAdapter | null {
  return adapters.find((a) => a.detect(raw)) ?? null;
}

export function getAdapterById(id: string): BankAdapter | null {
  return adapters.find((a) => a.id === id) ?? null;
}
