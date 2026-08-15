import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ChevronRight, Plus, ShieldCheck, Star } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { useApp, useT } from "@/lib/app-context";
import { getHistory, getSavedQRs } from "@/lib/storage/repository";
import { formatKip } from "@/lib/qr/currency";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QR Pay Laos — Accueil" },
      {
        name: "description",
        content: "Générez en quelques secondes un QR de paiement en kips avec montant prérempli.",
      },
      { property: "og:title", content: "QR Pay Laos" },
      {
        property: "og:description",
        content: "Transformez votre QR bancaire en QR de paiement avec montant.",
      },
    ],
  }),
  component: HomeScreen,
});

function HomeScreen() {
  const t = useT();
  const { settings, ready } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !settings.onboardingDone) navigate({ to: "/onboarding" });
  }, [ready, settings.onboardingDone, navigate]);

  const saved = useQuery({ queryKey: ["saved"], queryFn: getSavedQRs });
  const history = useQuery({ queryKey: ["history"], queryFn: getHistory });

  const list = (saved.data ?? [])
    .slice()
    .sort((a, b) => Number(b.favorite) - Number(a.favorite))
    .slice(0, 5);

  return (
    <MobileShell>
      <div className="safe-top -mx-4 mb-5 bg-brand px-5 pb-8 text-primary-foreground">
        <p className="text-xs font-semibold tracking-[0.2em] opacity-80">₭ LAK</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{t("appName")}</h1>
        <p className="mt-2 max-w-[16rem] text-sm opacity-90">{t("tagline")}</p>
      </div>

      <Button
        variant="hero"
        size="block"
        onClick={() => navigate({ to: "/import" })}
        className="mb-6"
      >
        <Plus /> {t("addQr")}
      </Button>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("savedQrs")}</h2>
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            {t("noSavedQrs")}
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((qr) => (
              <li key={qr.id}>
                <button
                  onClick={() => navigate({ to: "/pay/$id", params: { id: qr.id } })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground font-semibold">
                    {qr.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate font-semibold">
                      {qr.favorite && <Star className="size-4 fill-accent text-accent" />}
                      {qr.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {qr.bank ?? "—"} · {new Date(qr.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                    {t("pay")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <button
          onClick={() => navigate({ to: "/history" })}
          className="flex w-full items-center justify-between rounded-2xl bg-card p-4 shadow-card"
        >
          <span className="font-semibold">{t("history")}</span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {history.data?.[0] ? formatKip(history.data[0].amount) : "—"}
            <ChevronRight className="size-4" />
          </span>
        </button>
      </section>

      <p className="flex items-start gap-2 rounded-2xl bg-secondary/60 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        {t("privacyDesc")}
      </p>
    </MobileShell>
  );
}
