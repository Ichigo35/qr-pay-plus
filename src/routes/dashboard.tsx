import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, useT } from "@/lib/app-context";
import { formatKip } from "@/lib/qr/currency";
import { getHistory } from "@/lib/storage/repository";
import type { HistoryEntry } from "@/lib/storage/models";

// NOTE (abonnements) : ce tableau de bord est un candidat naturel pour devenir
// une fonctionnalité "Premium" quand le système d'abonnements à paliers sera
// mis en place (voir /Users/jimnytcha/qr-pay-plus/CLAUDE.md — section
// Abonnements prévus). Aucune restriction n'est appliquée pour l'instant :
// tout est accessible localement, sans backend ni paiement réel.

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — QR Pay Laos" },
      {
        name: "description",
        content: "Historique des paiements générés, triable par mois et par QR bancaire.",
      },
      { property: "og:title", content: "Tableau de bord" },
      { property: "og:description", content: "Montants totaux par mois et par bénéficiaire." },
    ],
  }),
  component: DashboardScreen,
});

const ALL = "__all__";

const LOCALE_BY_LANG: Record<string, string> = { fr: "fr-FR", en: "en-US", lo: "lo-LA" };

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string, locale: string): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y as number, (m as number) - 1, 1);
  try {
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  } catch {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
}

function qrGroupKey(entry: HistoryEntry): string {
  return entry.savedQrId ?? `name:${entry.name}`;
}

function DashboardScreen() {
  const t = useT();
  const { lang } = useApp();
  const locale = LOCALE_BY_LANG[lang] ?? "en-US";
  const { data: entries } = useQuery({ queryKey: ["history"], queryFn: getHistory });
  const list = useMemo(() => entries ?? [], [entries]);

  const [month, setMonth] = useState<string>(ALL);
  const [qrFilter, setQrFilter] = useState<string>(ALL);

  const months = useMemo(() => {
    const set = new Set(list.map((e) => monthKey(e.createdAt)));
    return Array.from(set).sort().reverse();
  }, [list]);

  const qrOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of list) {
      const key = qrGroupKey(e);
      if (!map.has(key)) map.set(key, e.name);
    }
    return Array.from(map.entries());
  }, [list]);

  const filtered = useMemo(
    () =>
      list
        .filter((e) => month === ALL || monthKey(e.createdAt) === month)
        .filter((e) => qrFilter === ALL || qrGroupKey(e) === qrFilter)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [list, month, qrFilter],
  );

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  const byQr = useMemo(() => {
    const map = new Map<
      string,
      { key: string; name: string; bank: string | null; total: number; count: number }
    >();
    for (const e of filtered) {
      const key = qrGroupKey(e);
      const cur = map.get(key) ?? { key, name: e.name, bank: e.bank, total: 0, count: 0 };
      cur.total += e.amount;
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const maxQrTotal = byQr[0]?.total ?? 0;

  return (
    <MobileShell title={t("dashboard")} back="/history">
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger aria-label={t("filterByMonth")}>
            <SelectValue placeholder={t("allMonths")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allMonths")}</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={qrFilter} onValueChange={setQrFilter}>
          <SelectTrigger aria-label={t("filterByQr")}>
            <SelectValue placeholder={t("allQrs")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allQrs")}</SelectItem>
            {qrOptions.map(([key, name]) => (
              <SelectItem key={key} value={key}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">{t("totalAmount")}</p>
          <p className="tabular mt-1 text-xl font-bold text-primary">{formatKip(total)}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">{t("transactions")}</p>
          <p className="tabular mt-1 text-xl font-bold">{filtered.length}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("emptyHistory")}
        </p>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("byQrCode")}</h2>
            <ul className="space-y-2">
              {byQr.map((qr) => (
                <li key={qr.key} className="rounded-2xl bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{qr.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {qr.bank ?? "—"} · {qr.count} {t("transactions").toLowerCase()}
                      </p>
                    </div>
                    <p className="tabular shrink-0 font-bold text-primary">{formatKip(qr.total)}</p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${maxQrTotal > 0 ? Math.max(4, (qr.total / maxQrTotal) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("history")}</h2>
            <ul className="space-y-3">
              {filtered.map((entry) => (
                <li key={entry.id} className="rounded-2xl bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.bank ?? "—"} · {new Date(entry.createdAt).toLocaleString(locale)}
                      </p>
                    </div>
                    <p className="tabular shrink-0 font-bold text-primary">
                      {formatKip(entry.amount)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </MobileShell>
  );
}
