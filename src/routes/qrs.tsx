import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/app-context";
import { deleteQR, getSavedQRs, updateQR } from "@/lib/storage/repository";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/qrs")({
  head: () => ({
    meta: [
      { title: "Mes QR enregistrés — QR Pay Laos" },
      { name: "description", content: "Gérez vos bénéficiaires, favoris et QR bancaires locaux." },
      { property: "og:title", content: "Mes QR enregistrés" },
      { property: "og:description", content: "Favoris, renommage et suppression de bénéficiaires." },
    ],
  }),
  component: SavedScreen,
});

function SavedScreen() {
  const t = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { data: list } = useQuery({ queryKey: ["saved"], queryFn: getSavedQRs });
  const refresh = () => qc.invalidateQueries({ queryKey: ["saved"] });

  const items = (list ?? []).slice().sort((a, b) => Number(b.favorite) - Number(a.favorite));

  return (
    <MobileShell title={t("myQrs")}>
      <Button variant="hero" size="touch" className="mb-4 w-full" onClick={() => navigate({ to: "/import" })}>
        <Plus /> {t("addQr").replace("+ ", "")}
      </Button>

      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("noSavedQrs")}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((qr) => (
          <li key={qr.id} className="rounded-2xl bg-card p-4 shadow-card">
            {editing === qr.id ? (
              <div className="flex gap-2">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={40} />
                <Button
                  size="sm"
                  onClick={async () => {
                    await updateQR(qr.id, { name: draft.trim().slice(0, 40) || qr.name });
                    setEditing(null);
                    refresh();
                  }}
                >
                  OK
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  aria-label={t("favorite")}
                  onClick={async () => {
                    await updateQR(qr.id, { favorite: !qr.favorite });
                    refresh();
                  }}
                >
                  <Star
                    className={cn(
                      "size-6",
                      qr.favorite ? "fill-accent text-accent" : "text-muted-foreground",
                    )}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{qr.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {qr.bank ?? "—"} · {new Date(qr.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  aria-label={t("rename")}
                  className="p-2 text-muted-foreground"
                  onClick={() => {
                    setEditing(qr.id);
                    setDraft(qr.name);
                  }}
                >
                  <Pencil className="size-5" />
                </button>
                <button
                  aria-label={t("delete")}
                  className="p-2 text-destructive"
                  onClick={async () => {
                    await deleteQR(qr.id);
                    refresh();
                  }}
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            )}
            <Button
              variant="soft"
              size="touch"
              className="mt-3 w-full"
              onClick={() => navigate({ to: "/pay/$id", params: { id: qr.id } })}
            >
              {t("pay")}
            </Button>
          </li>
        ))}
      </ul>
    </MobileShell>
  );
}
