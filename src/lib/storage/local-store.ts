import { Preferences } from "@capacitor/preferences";

/**
 * Stockage local uniquement (Capacitor Preferences -> Keychain / SharedPreferences).
 * Aucune donnée bancaire n'est envoyée à un serveur.
 * L'API est asynchrone pour permettre l'ajout futur d'un backend sans refonte.
 */
export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key });
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function writeJSON<T>(key: string, value: T): Promise<void> {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) });
  } catch {
    /* stockage indisponible : on n'expose aucune donnée en log */
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await Preferences.remove({ key });
  } catch {
    /* noop */
  }
}
