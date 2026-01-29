"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SeasonRow = { id: string; name: string; starts_at: string; ends_at: string | null; created_at: string };

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSeasonsClient(props: { seasons: SeasonRow[]; initialError: string | null }) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("Nuova stagione");
  const [startsAt, setStartsAt] = useState(toLocalInputValue(new Date().toISOString()));
  const [endsAt, setEndsAt] = useState<string>(""); // opzionale
  const [busy, setBusy] = useState(false);

  const active = useMemo(() => {
    const now = Date.now();
    return props.seasons.find((s) => {
      const a = new Date(s.starts_at).getTime();
      const b = s.ends_at ? new Date(s.ends_at).getTime() : Infinity;
      return a <= now && now < b;
    });
  }, [props.seasons]);

  async function createSeason() {
    setBusy(true);
    try {
      const startsIso = new Date(startsAt).toISOString();
      const endsIso = endsAt ? new Date(endsAt).toISOString() : null;

      const { data, error } = await supabase.rpc("admin_create_season", {
        p_name: name,
        p_starts_at: startsIso,
        p_ends_at: endsIso,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Stagione creata");
      toast.message(`ID: ${String(data).slice(0, 8)}…`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function closeSeason(id: string) {
    const ends = prompt("Inserisci la data/ora di fine (YYYY-MM-DDTHH:MM) oppure lascia vuoto per annullare:");
    if (!ends) return;

    setBusy(true);
    try {
      const endsIso = new Date(ends).toISOString();
      const { error } = await supabase.rpc("admin_close_season", {
        p_season_id: id,
        p_ends_at: endsIso,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Stagione chiusa");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin stagioni</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {props.initialError && (
            <Alert>
              <AlertDescription>{props.initialError}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm opacity-80">
            Stagione attiva (in base alle date): <b>{active?.name ?? "—"}</b>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Crea nuova stagione</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-xs opacity-70">Nome</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs opacity-70">Inizio</div>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="text-xs opacity-70">Fine (opzionale)</div>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>

          <Button onClick={createSeason} disabled={busy}>
            {busy ? "..." : "Crea"}
          </Button>

          <div className="text-xs opacity-60">
            Nota: il DB blocca stagioni che si sovrappongono.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Elenco stagioni</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {props.seasons.length === 0 ? (
            <div className="text-sm opacity-70">Nessuna stagione.</div>
          ) : (
            props.seasons.map((s) => (
              <div key={s.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs opacity-70">
                    {new Date(s.starts_at).toLocaleString("it-IT")} →{" "}
                    {s.ends_at ? new Date(s.ends_at).toLocaleString("it-IT") : "in corso"}
                  </div>
                  <div className="text-xs opacity-60">ID: {s.id}</div>
                </div>

                <div className="flex gap-2">
                  {!s.ends_at && (
                    <Button variant="outline" onClick={() => closeSeason(s.id)} disabled={busy}>
                      Chiudi
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
