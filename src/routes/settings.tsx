import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApp, useT } from "@/lib/app-context";
import { LANGUAGES, type Language } from "@/lib/i18n/translations";
import { DEMO_QRS } from "@/lib/qr/demo";
import { decodePayload } from "@/lib/qr/pipeline";
import { saveQR } from "@/lib/storage/repository";
import { cn } from "@/lib/utils";
import type { AppSettings } from "@/lib/storage/models";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — QR Pay Laos" },
      { name: "description", content: "Langue, thème, mode démonstration et confidentialité." },
      { property: "og:title", content: "Paramètres" },
      { property: "og:description", content: "Lao, français, anglais, mode sombre et démo." },
    ],
  }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const t = useT();
  const { settings, update } = useApp();
  const qc = useQueryClient();

  const themes: { value: AppSettings["theme"]; label: string }[] = [
    { value: "light", label: t("light") },
    { value: "dark", label: t("dark") },
    { value: "system", label: t("system") },
  ];

  async function loadDemo() {
    for (const demo of DEMO_QRS) {
      const parsed = decodePayload(demo.payload);
      if (!parsed.ok) continue;
      await saveQR({
        name: demo.name,
        payload: demo.payload,
        bank: parsed.data.bank,
        merchantName: parsed.data.merchantName,
      });
    }
    qc.invalidateQueries({ queryKey: ["saved"] });
    toast.success(t("saved"));
  }

  return (
    <MobileShell title={t("settings")}>
      <section className="mb-5 rounded-2xl bg-card p-4 shadow-card">
        <p className="mb-3 text-sm font-semibold">{t("language")}</p>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => update({ language: lang.code as Language })}
              className={cn(
                "rounded-xl py-3 text-sm font-medium",
                settings.language === lang.code
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-5 rounded-2xl bg-card p-4 shadow-card">
        <p className="mb-3 text-sm font-semibold">{t("theme")}</p>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => update({ theme: theme.value })}
              className={cn(
                "rounded-xl py-3 text-sm font-medium",
                settings.theme === theme.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-5 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{t("demoMode")}</p>
            <p className="text-xs text-muted-foreground">{t("demoModeDesc")}</p>
          </div>
          <Switch
            checked={settings.demoMode}
            onCheckedChange={(checked) => update({ demoMode: checked })}
          />
        </div>
        {settings.demoMode && (
          <Button variant="soft" size="touch" className="mt-4 w-full" onClick={loadDemo}>
            {t("loadDemo")}
          </Button>
        )}
      </section>

      <section className="rounded-2xl bg-secondary/60 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-primary" /> {t("privacy")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{t("privacyDesc")}</p>
      </section>
    </MobileShell>
  );
}
