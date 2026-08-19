import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/app-context";
import { formatKip } from "@/lib/qr/currency";
import { clearHistory, getHistory } from "@/lib/storage/repository";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Historique des paiements — QR Pay Laos" },
      {
        name: "description",
        content: "Historique local des QR de paiement générés sur ce mobile.",
      },
      { property: "og:title", content: "Historique des paiements" },
      { property: "og:description", content: "Regénérez un QR à partir d'une entrée passée." },
    ],
  }),
  component: HistoryScreen,
});

function HistoryScreen() {
  const t = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: entries } = useQuery({ queryKey: ["history"], queryFn: getHistory });
  const list = entries ?? [];

  return (
    <MobileShell
      title={t("history")}
      action={
        <Link
          to="/dashboard"
          aria-label={t("dashboard")}
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
        >
          <LayoutDashboard className="size-5" />
        </Link>
      }
    >
      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("emptyHistory")}
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {list.map((entry) => (
              <li key={entry.id} className="rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.bank ?? "—"} · {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="tabular shrink-0 font-bold text-primary">
                    {formatKip(entry.amount)}
                  </p>
                </div>
                {entry.savedQrId && (
                  <Button
                    variant="soft"
                    size="touch"
                    className="mt-3 w-full"
                    onClick={() =>
                      navigate({ to: "/pay/$id", params: { id: entry.savedQrId as string } })
                    }
                  >
                    {t("regenerate")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="touch"
            className="mt-6 w-full text-destructive"
            onClick={async () => {
              await clearHistory();
              qc.invalidateQueries({ queryKey: ["history"] });
            }}
          >
            {t("clearHistory")}
          </Button>
        </>
      )}
    </MobileShell>
  );
}
