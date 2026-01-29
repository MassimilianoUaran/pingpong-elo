"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Player = { id: string; display_name: string };
type MatchFeedRow = {
  id: string;
  played_at: string;
  created_at: string;
  player_a_id: string;
  player_a_name: string;
  player_b_id: string;
  player_b_name: string;
  score_a: number;
  score_b: number;
  delta_a: number | null;
  delta_b: number | null;
};

export default function MatchesClient(props: {
  players: Player[];
  matches: MatchFeedRow[];
  initialError: string | null;
  initialPlayer: string | null;
}) {
  const router = useRouter();
  const [player, setPlayer] = useState(props.initialPlayer ?? "");

  const playerLabel = useMemo(() => {
    const p = props.players.find((x) => x.id === player);
    return p?.display_name ?? "";
  }, [player, props.players]);

  function applyFilter() {
    const url = player ? `/matches?player=${encodeURIComponent(player)}` : "/matches";
    router.push(url);
    router.refresh();
  }

  function clearFilter() {
    setPlayer("");
    router.push("/matches");
    router.refresh();
  }

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  function deltaBadge(d: number | null) {
    if (d === null || d === undefined) return <Badge variant="secondary">Δ ?</Badge>;
    if (d > 0) return <Badge>+{d}</Badge>;
    if (d < 0) return <Badge variant="destructive">{d}</Badge>;
    return <Badge variant="secondary">0</Badge>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storico partite confermate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.initialError && (
            <div className="text-sm opacity-80">{props.initialError}</div>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <div className="text-xs opacity-70">Filtra per giocatore</div>
              <select
                className="border rounded-md p-2 bg-background min-w-[260px]"
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
              >
                <option value="">Tutti</option>
                {props.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="border rounded-md px-3 py-2 text-sm"
              onClick={applyFilter}
            >
              Applica
            </button>

            <button
              className="border rounded-md px-3 py-2 text-sm"
              onClick={clearFilter}
              disabled={!player}
            >
              Reset
            </button>

            {playerLabel && (
              <div className="text-sm opacity-70">
                Mostrando: <b>{playerLabel}</b>
              </div>
            )}
          </div>

          {props.matches.length === 0 ? (
            <div className="text-sm opacity-70">Nessuna partita trovata.</div>
          ) : (
            <div className="space-y-3">
              {props.matches.map((m) => (
                <Card key={m.id} className="border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">
                        {m.player_a_name} <span className="opacity-70">vs</span> {m.player_b_name}
                      </div>
                      <div className="text-xs opacity-60">{fmt(m.played_at)}</div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm">
                        Risultato: <b>{m.score_a}</b> - <b>{m.score_b}</b>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs opacity-60">{m.player_a_name}</span>
                        {deltaBadge(m.delta_a)}
                        <span className="text-xs opacity-60">{m.player_b_name}</span>
                        {deltaBadge(m.delta_b)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
