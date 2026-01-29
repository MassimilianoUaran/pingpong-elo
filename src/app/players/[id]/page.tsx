import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import EloChart from "@/components/me/EloChart"; // riusiamo il tuo componente esistente

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function PlayerPage({ params }: { params: Params }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const playerId = params.id;

  const { data: player, error: pErr } = await supabase
    .from("players")
    .select("id, display_name")
    .eq("id", playerId)
    .single();

  if (pErr || !player) {
    return <div className="text-sm opacity-80">Giocatore non trovato.</div>;
  }

  const { data: leaderboard } = await supabase
    .from("v_leaderboard")
    .select("rank, rating")
    .eq("player_id", playerId)
    .single();

  const { data: stats } = await supabase
    .from("v_player_stats")
    .select("matches_played, wins, losses, winrate_pct, last_played_at")
    .eq("player_id", playerId)
    .single();

  const { data: series } = await supabase
    .from("v_player_elo_series")
    .select("played_at, rating")
    .eq("player_id", playerId)
    .order("played_at", { ascending: true })
    .limit(400);

  const { data: recent } = await supabase
    .from("v_match_player_rows")
    .select("match_id, played_at, opponent_id, opponent_name, player_score, opponent_score, result, delta")
    .eq("player_id", playerId)
    .order("played_at", { ascending: false })
    .limit(20);

  const { data: opponents } = await supabase
    .from("v_player_opponents")
    .select("opponent_id, opponent_name, matches, wins, losses, winrate_pct")
    .eq("player_id", playerId)
    .order("matches", { ascending: false })
    .limit(10);

  function fmt(iso?: string | null) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-6">
      {/* HERO */}
      <Card>
        <CardHeader>
          <CardTitle>{player.display_name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          <div className="space-y-1">
            <div className="text-xs opacity-70">Rank</div>
            <div className="text-2xl font-semibold">#{leaderboard?.rank ?? "—"}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs opacity-70">Elo</div>
            <div className="text-2xl font-semibold">{leaderboard?.rating ?? 1000}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs opacity-70">Partite</div>
            <div className="text-2xl font-semibold">{stats?.matches_played ?? 0}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs opacity-70">Winrate</div>
            <div className="text-2xl font-semibold">{stats?.winrate_pct ?? 0}%</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs opacity-70">Ultima partita</div>
            <div className="text-sm">{fmt(stats?.last_played_at)}</div>
          </div>
        </CardContent>
      </Card>

      {/* ELO CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Andamento Elo</CardTitle>
        </CardHeader>
        <CardContent>
          <EloChart data={(series ?? []) as any} />
        </CardContent>
      </Card>

      {/* RECENT + H2H */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ultime partite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recent ?? []).length === 0 ? (
              <div className="text-sm opacity-70">Nessuna partita.</div>
            ) : (
              (recent ?? []).map((m: any) => (
                <div key={m.match_id} className="border rounded-md p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.opponent_name}</div>
                    <div className="text-xs opacity-60">{fmt(m.played_at)}</div>
                    <div className="text-sm">
                      {m.player_score} - {m.opponent_score} • <b>{m.result}</b>
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {m.delta === null ? "Δ ?" : (m.delta > 0 ? `+${m.delta}` : `${m.delta}`)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avversari più frequenti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(opponents ?? []).length === 0 ? (
              <div className="text-sm opacity-70">Nessun dato head-to-head.</div>
            ) : (
              (opponents ?? []).map((o: any) => (
                <div key={o.opponent_id} className="border rounded-md p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.opponent_name}</div>
                    <div className="text-xs opacity-60">
                      Match: {o.matches} • W {o.wins} / L {o.losses}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{o.winrate_pct}%</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
