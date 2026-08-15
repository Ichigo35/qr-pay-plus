export interface SavedQR {
  id: string;
  name: string;
  payload: string;
  bank: string | null;
  merchantName: string | null;
  favorite: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface HistoryEntry {
  id: string;
  savedQrId: string | null;
  name: string;
  bank: string | null;
  merchantName: string | null;
  amount: number;
  payload: string;
  createdAt: string;
}

export interface AppSettings {
  language: "fr" | "lo" | "en";
  onboardingDone: boolean;
  demoMode: boolean;
  theme: "light" | "dark" | "system";
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: "fr",
  onboardingDone: false,
  demoMode: false,
  theme: "system",
};

export const KEYS = {
  saved: "qrpay.saved",
  history: "qrpay.history",
  settings: "qrpay.settings",
} as const;

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
