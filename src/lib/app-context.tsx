import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_SETTINGS, type AppSettings } from "./storage/models";
import { getSettings, saveSettings } from "./storage/repository";
import { translations, type Language, type TranslationKey } from "./i18n/translations";

interface AppContextValue {
  settings: AppSettings;
  ready: boolean;
  update: (patch: Partial<AppSettings>) => Promise<void>;
  t: (key: TranslationKey) => string;
  lang: Language;
}

const AppContext = createContext<AppContextValue | null>(null);

function applyTheme(theme: AppSettings["theme"]) {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", Boolean(dark));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getSettings().then((s) => {
      if (!active) return;
      setSettings(s);
      applyTheme(s.theme);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await saveSettings(patch);
    setSettings(next);
    applyTheme(next.theme);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      ready,
      update,
      lang: settings.language,
      t: (key) => translations[settings.language][key] ?? translations.fr[key],
    }),
    [settings, ready, update],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function useT() {
  return useApp().t;
}
