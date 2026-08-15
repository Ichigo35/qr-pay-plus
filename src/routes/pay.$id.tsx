import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Delete } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/app-context";
import { formatAmount, MAX_AMOUNT, validateAmount } from "@/lib/qr/currency";
import { getSavedQRs } from "@/lib/storage/repository";

export const Route = createFileRoute("/pay/$id")({
  head: () => ({
    meta: [
      { title: "Nouveau paiement — QR Pay Laos" },
      { name: "description", content: "Saisissez le montant en kips à préremplir dans le QR." },
      { property: "og:title", content: "Nouveau paiement" },
      { property: "og:description", content: "Montant en kips, QR généré instantanément." },
    ],
  }),
  component: PayScreen,
});

const QUICK = [10000, 20000, 50000, 100000];

function PayScreen() {
  const { id } = Route.useParams();
  const t = useT();
  const navigate = useNavigate();
  const [digits, setDigits] = useState("");

  const { data: saved } = useQuery({ queryKey: ["saved"], queryFn: getSavedQRs });
  const qr = saved?.find((q) => q.id === id);
  const amount = digits ? Number(digits) : 0;
  const valid = validateAmount(amount).ok;

  const press = (key: string) => {
    if (key === "del") return setDigits((d) => d.slice(0, -1));
    const next = (digits + key).replace(/^0+/, "");
    if (Number(next || "0") > MAX_AMOUNT) return;
    setDigits(next.slice(0, 12));
  };

  return (
    <MobileShell title={t("newPayment")} back="/" hideNav>
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <p className="text-xs text-muted-foreground">{t("beneficiary")}</p>
        <p className="truncate text-lg font-semibold">{qr?.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          {t("bank")} : {qr?.bank ?? "—"}
        </p>
      </div>

      <div className="my-6 text-center">
        <p className="text-xs font-medium text-muted-foreground">{t("amount")}</p>
        <p className="tabular mt-1 text-4xl font-bold tracking-tight">
          {formatAmount(amount)} <span className="text-2xl text-primary">₭</span>
        </p>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => setDigits(String(q))}
            className="tabular rounded-xl bg-secondary py-3 text-xs font-semibold text-secondary-foreground active:scale-95"
          >
            {formatAmount(q)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "del"].map((key) => (
          <button
            key={key}
            onClick={() => press(key)}
            aria-label={key === "del" ? "Effacer" : key}
            className="flex h-16 items-center justify-center rounded-2xl bg-card text-2xl font-semibold shadow-card active:scale-95"
          >
            {key === "del" ? <Delete className="size-6" /> : key}
          </button>
        ))}
      </div>

      <div className="safe-bottom sticky bottom-0 mt-6 bg-background pt-2">
        <Button
          variant="hero"
          size="block"
          disabled={!valid || !qr}
          onClick={() =>
            navigate({ to: "/qr/$id", params: { id }, search: { amount } })
          }
        >
          {t("generateQr")}
        </Button>
        {!valid && digits.length > 0 && (
          <p className="pt-2 text-center text-xs text-destructive">{t("invalidAmount")}</p>
        )}
      </div>
    </MobileShell>
  );
}
