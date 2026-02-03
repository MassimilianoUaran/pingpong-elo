"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Season = { id: string; name: string };

type Row = {
  id: string;
  season_id: string;
  played_at: string;
  created_at: string;
  player_a_id: string;
  player_a_name: string;
  player_b_id: string;
  player_b_name: string;
  score_a: number;
  score_b: number;
  created_by_player: string | null;
  created_by_name: string;
};

export default function AdminPendingClient(props: {
  seasons: Season[];
  currentSeasonId: string;
  currentSeasonName: string;
  rows: Row[];
  initialError: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [q, setQ] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return props.rows;
    return props.rows.filter((r) =>
      `${r.player_a_name} ${r.player_b_name} ${r.created_by_name}`.toLowerCase().includes(s)
    );
  }, [props.rows, q]);

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  async function forceConfirm(id: string) {
    setLoadingId(id);
    const reason = "Admin force confirm";
    const { error } = await supabase.rpc("admin_force_confirm_match", {
      p_match_id: id,
      p_reason: reason,
    });
    setLoadingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Partita confermata da admin. Elo aggiornato.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle>Admin Pending — {props.currentSeasonName}</CardTitle>

          <form action="/season" method="post" className="flex items-center gap-2">
            <input type="hidden" name="return_to" value="/admin/pending" />
            <select
              name="season_id"
              defaultValue={props.currentSeasonId}
              className="border rounded-md px-2 py-2 bg-background text-sm max-w-[240px]"
              onChange={(e) => (e.currentTarget.form as HTMLFormElement)?.requestSubmit()}
              title="Filtra per stagione"
            >
              {props.seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </form>
        </CardHeader>

        <CardContent className="space-y-4">
          {props.initialError && (
            <Alert>
              <AlertDescription>{props.initialError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca (giocatori / creatore)..."
              className="w-[320px]"
            />
            <div className="text-xs opacity-70">
              Pending: <b>{filtered.length}</b>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-sm opacity-70">Nessun pending in questa stagione.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => {
                const isLoading = loadingId === r.id;
                return (
                  <div key={r.id} className="border rounded-md p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">
                        {r.player_a_name} <span className="opacity-70">vs</span> {r.player_b_name}
                      </div>
                      <div className="text-sm opacity-80">{r.score_a} - {r.score_b}</div>
                      <div className="text-xs opacity-60">
                        Giocata: {fmt(r.played_at)} • Inserita: {fmt(r.created_at)} • Creatore: {r.created_by_name}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => forceConfirm(r.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? "..." : "Conferma (admin)"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
