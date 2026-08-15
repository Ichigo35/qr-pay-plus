import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, KeyRound, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, useT } from "@/lib/app-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Bienvenue — QR Pay Laos" },
      { name: "description", content: "Découvrez comment générer un QR de paiement en 3 étapes." },
      { property: "og:title", content: "Bienvenue sur QR Pay Laos" },
      { property: "og:description", content: "Importez, saisissez le montant, générez le QR." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const t = useT();
  const { update } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const steps = [
    { icon: QrCode, title: t("onboard1Title"), body: t("onboard1Body") },
    { icon: Camera, title: t("onboard2Title"), body: t("onboard2Body") },
    { icon: KeyRound, title: t("onboard3Title"), body: t("onboard3Body") },
  ];
  const current = steps[step]!;
  const last = step === steps.length - 1;

  const finish = async () => {
    await update({ onboardingDone: true });
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-brand px-6 text-primary-foreground">
      <div className="safe-top flex justify-end">
        <button onClick={finish} className="p-2 text-sm opacity-80">
          {t("skip")}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-8 flex size-24 items-center justify-center rounded-3xl bg-primary-foreground/15">
          <current.icon className="size-12" />
        </div>
        <h1 className="text-2xl font-bold">{current.title}</h1>
        <p className="mt-3 max-w-xs text-sm opacity-90">{current.body}</p>
      </div>

      <div className="mb-4 flex justify-center gap-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === step ? "w-6 bg-primary-foreground" : "w-1.5 bg-primary-foreground/40",
            )}
          />
        ))}
      </div>

      <div className="safe-bottom">
        <Button
          variant="accent"
          size="block"
          onClick={() => (last ? finish() : setStep(step + 1))}
        >
          {last ? t("start") : t("next")}
        </Button>
      </div>
    </div>
  );
}
