import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Camera, Images, Loader2, ShieldCheck } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { useApp, useT } from "@/lib/app-context";
import { pickImageDataUrl } from "@/lib/camera";
import { scanImageFile } from "@/lib/qr/scanner";
import { decodePayload } from "@/lib/qr/pipeline";
import { DEMO_QRS } from "@/lib/qr/demo";
import type { QRData } from "@/lib/qr/types";
import { saveQR } from "@/lib/storage/repository";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Ajouter un QR bancaire — QR Pay Laos" },
      {
        name: "description",
        content: "Photographiez ou importez votre QR bancaire : lecture 100% locale sur mobile.",
      },
      { property: "og:title", content: "Ajouter un QR bancaire" },
      { property: "og:description", content: "Import ou photo, détection et décodage locaux." },
    ],
  }),
  component: ImportScreen,
});

type State =
  | { kind: "idle"; error?: string }
  | { kind: "loading" }
  | { kind: "verify"; data: QRData }
  | { kind: "unsupported" };

function ImportScreen() {
  const t = useT();
  const { settings } = useApp();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handlePick(source: "camera" | "gallery") {
    setState({ kind: "loading" });
    try {
      const dataUrl = await pickImageDataUrl(source);
      if (!dataUrl) return setState({ kind: "idle" });
      const raw = await scanImageFile(dataUrl);
      if (!raw) return setState({ kind: "idle", error: t("qrNotFound") });
      handlePayload(raw);
    } catch {
      setState({ kind: "idle", error: t("qrNotFound") });
    }
  }

  function handlePayload(raw: string) {
    const result = decodePayload(raw);
    if (!result.ok) return setState({ kind: "unsupported" });
    if (!result.data.supportsAmountInjection) return setState({ kind: "unsupported" });
    setState({ kind: "verify", data: result.data });
  }

  async function confirm(data: QRData) {
    const saved = await saveQR({
      name: data.merchantName || t("unnamed"),
      payload: data.rawPayload,
      bank: data.bank,
      merchantName: data.merchantName,
    });
    await qc.invalidateQueries({ queryKey: ["saved"] });
    navigate({ to: "/pay/$id", params: { id: saved.id } });
  }

  return (
    <MobileShell title={t("addQr").replace("+ ", "")} back="/" hideNav>
      {state.kind === "loading" && (
        <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          {t("processing")}
        </div>
      )}

      {state.kind === "idle" && (
        <div className="space-y-4 pt-4">
          {state.error && (
            <p className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {state.error}
            </p>
          )}
          <Button variant="hero" size="block" onClick={() => handlePick("camera")}>
            <Camera /> {t("takePhoto")}
          </Button>
          <Button variant="soft" size="block" onClick={() => handlePick("gallery")}>
            <Images /> {t("pickImage")}
          </Button>

          <div className="space-y-2 rounded-2xl border border-dashed border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              {settings.demoMode ? t("demoMode") : t("trySample")}
            </p>
            {(settings.demoMode ? DEMO_QRS : DEMO_QRS.slice(0, 1)).map((demo) => (
              <Button
                key={demo.name}
                variant="outline"
                size="touch"
                className="w-full"
                onClick={() => handlePayload(demo.payload)}
              >
                {demo.name}
              </Button>
            ))}
          </div>


          <p className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            {t("privacyDesc")}
          </p>
        </div>
      )}

      {state.kind === "unsupported" && (
        <div className="space-y-4 pt-8 text-center">
          <AlertTriangle className="mx-auto size-10 text-accent" />
          <h2 className="text-lg font-semibold">{t("unknownFormatTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("unknownFormatBody")}</p>
          <Button variant="hero" size="block" onClick={() => setState({ kind: "idle" })}>
            {t("tryAnother")}
          </Button>
        </div>
      )}

      {state.kind === "verify" && (
        <div className="space-y-5 pt-2">
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <p className="text-sm font-semibold text-success">{t("qrDetected")}</p>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label={t("beneficiary")} value={state.data.merchantName ?? "—"} />
              <Row label={t("bank")} value={state.data.bank ?? "—"} />
              <Row
                label={t("qrInfo")}
                value={`${state.data.format.toUpperCase()} · ${state.data.currency ?? "—"}${
                  state.data.merchantCity ? ` · ${state.data.merchantCity}` : ""
                }`}
              />
            </dl>
          </div>
          <p className="text-center text-sm font-medium">{t("isCorrect")}</p>
          <Button variant="hero" size="block" onClick={() => confirm(state.data)}>
            {t("confirm")}
          </Button>
          <Button variant="soft" size="block" onClick={() => setState({ kind: "idle" })}>
            {t("retry")}
          </Button>
        </div>
      )}
    </MobileShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-semibold">{value}</dd>
    </div>
  );
}
