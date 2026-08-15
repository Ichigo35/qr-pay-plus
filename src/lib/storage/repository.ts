import { readJSON, writeJSON } from "./local-store";
import {
  DEFAULT_SETTINGS,
  KEYS,
  newId,
  type AppSettings,
  type HistoryEntry,
  type SavedQR,
} from "./models";

const HISTORY_LIMIT = 100;

export async function getSavedQRs(): Promise<SavedQR[]> {
  return readJSON<SavedQR[]>(KEYS.saved, []);
}

export async function saveQR(
  input: Omit<SavedQR, "id" | "createdAt" | "lastUsedAt" | "favorite"> & { favorite?: boolean },
): Promise<SavedQR> {
  const list = await getSavedQRs();
  const existing = list.find((q) => q.payload === input.payload);
  if (existing) {
    existing.name = input.name || existing.name;
    await writeJSON(KEYS.saved, list);
    return existing;
  }
  const item: SavedQR = {
    id: newId(),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    favorite: input.favorite ?? false,
    ...input,
  };
  await writeJSON(KEYS.saved, [item, ...list]);
  return item;
}

export async function updateQR(id: string, patch: Partial<SavedQR>): Promise<void> {
  const list = await getSavedQRs();
  const next = list.map((q) => (q.id === id ? { ...q, ...patch, id: q.id } : q));
  await writeJSON(KEYS.saved, next);
}

export async function deleteQR(id: string): Promise<void> {
  const list = await getSavedQRs();
  await writeJSON(
    KEYS.saved,
    list.filter((q) => q.id !== id),
  );
}

export async function getHistory(): Promise<HistoryEntry[]> {
  return readJSON<HistoryEntry[]>(KEYS.history, []);
}

export async function addHistory(entry: Omit<HistoryEntry, "id" | "createdAt">): Promise<void> {
  const list = await getHistory();
  const item: HistoryEntry = { id: newId(), createdAt: new Date().toISOString(), ...entry };
  await writeJSON(KEYS.history, [item, ...list].slice(0, HISTORY_LIMIT));
}

export async function clearHistory(): Promise<void> {
  await writeJSON(KEYS.history, []);
}

export async function getSettings(): Promise<AppSettings> {
  return { ...DEFAULT_SETTINGS, ...(await readJSON<Partial<AppSettings>>(KEYS.settings, {})) };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await getSettings()), ...patch };
  await writeJSON(KEYS.settings, next);
  return next;
}
