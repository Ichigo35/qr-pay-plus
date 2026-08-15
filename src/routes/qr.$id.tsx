import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/app-context";
import { formatKip } from "@/lib/qr/currency";
import { createPaymentPayload, decodePayload } from "@/lib/qr/pipeline";
import { renderQRImage } from "@/lib/qr/generator";
import { scanDataUrl } from "@/lib/qr/scanner";
import { addHistory, getSavedQRs } from "@/lib/storage/repository";
import { saveQRImage, shareQRImage } from "@/lib/share";

export const Route = createFileRoute("/qr/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    amount: Math.max(0, Math.floor(Number(search['amount']) || 0)),
  }),
  head: () => ({
    meta: [
      { title: "QR de paiement généré — QR Pay Laos" },
      { name: "description", content: "QR de paiement vérifié, prêt à être scanné par le client." },
      { property: "og:title", content: "QR de paiement généré" },
      { property: "og:description", content: "Montant prérempli et QR validé avant affichage." },
    ],
  }),
  component: GeneratedQRScreen,
});

interface Generated {
  status: "valid" | "invalid";
  dataUrl?: string | undefined;
  error?: string | undefined;
}

function GeneratedQRScreen() {
  const { id } = Route.useParams();
  const { amount } = Route.useSearch();
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [result, setResult] = useState<Generated | null>(null);
  const logged = useRef(false);

  const { data: saved } = useQuery({ queryKey: ["saved"], queryFn: getSavedQRs });
  const qr = saved?.find((q) => q.id === id);

  useEffect(() => {
    if (!qr) return;
    let active = true;

    (async () => {
      const payment = createPaymentPayload(qr.payload, amount);
      if (payment.validationStatus !== "valid") {
        if (active) setResult({ status: "invalid", error: payment.validationError });
        return;
      }
      const image = await renderQRImage(payment.generatedPayload);
      // Contrôle final : le QR affiché est re-décodé depuis l'image générée.
      const decoded = await scanDataUrl(image.dataUrl);
      const check = decoded ? decodePayload(decoded) : null;
      const ok =
        decoded === payment.generatedPayload && check?.ok === true && check.data.amount === amount;
      if (!active) return;
      if (!ok) return setResult({ status: "invalid" });
      setResult({ status: "valid", dataUrl: image.dataUrl });

      if (!logged.current) {
        logged.current = true;
        await addHistory({
          savedQrId: qr.id,
          name: qr.name,
          bank: qr.bank,
          merchantName: qr.merchantName,
          amount,
          payload: payment.generatedPayload,
        });
        qc.invalidateQueries({ queryKey: ["history"] });
      }
    })();

    return () => {
      active = false;
    };
  }, [qr, amount, qc]);

  return (
    <MobileShell title={t("appName")} back="/" hideNav>
      {!result && (
        <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          {t("processing")}
        </div>
      )}

      {result?.status === "invalid" && (
        <div className="space-y-4 pt-10 text-center">
          <AlertTriangle className="mx-auto size-10 text-destructive" />
          <h2 className="text-lg font-semibold">{t("generationFailed")}</h2>
          {result.error && <p className="text-sm text-muted-foreground">{result.error}</p>}
          <Button
            variant="hero"
            size="block"
            onClick={() => navigate({ to: "/pay/$id", params: { id } })}
          >
            {t("retry")}
          </Button>
        </div>
      )}

      {result?.status === "valid" && result.dataUrl && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground">{t("amountToPay")}</p>
            <p className="tabular text-4xl font-bold tracking-tight">{formatKip(amount)}</p>
          </div>

          <div className="rounded-3xl bg-card p-4 shadow-lift">
            <img
              src={result.dataUrl}
              alt={`QR de paiement de ${formatKip(amount)}`}
              className="mx-auto aspect-square w-full max-w-xs rounded-2xl"
            />
            <div className="mt-4 space-y-1 text-center">
              <p className="font-semibold">{qr?.merchantName ?? qr?.name}</p>
              <p className="text-xs text-muted-foreground">
                {t("bank")} : {qr?.bank ?? "—"}
              </p>
              <p className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-success">
                <CheckCircle2 className="size-4" /> {t("qrValid")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="soft"
              size="touch"
              onClick={async () => {
                try {
                  await shareQRImage(
                    result.dataUrl!,
                    t("appName"),
                    `${qr?.name ?? ""} — ${formatKip(amount)}`,
                  );
                } catch {
                  toast.error(t("generationFailed"));
                }
              }}
            >
              <Share2 /> {t("share")}
            </Button>
            <Button
              variant="soft"
              size="touch"
              onClick={async () => {
                await saveQRImage(result.dataUrl!);
                toast.success(t("saved"));
              }}
            >
              <Download /> {t("save")}
            </Button>
          </div>

          <Button
            variant="hero"
            size="block"
            onClick={() => navigate({ to: "/pay/$id", params: { id } })}
          >
            {t("newAmount")}
          </Button>
        </div>
      )}
    </MobileShell>
  );
}
