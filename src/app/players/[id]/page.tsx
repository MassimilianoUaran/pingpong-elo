import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EloChart from "@/components/me/EloChart";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const season = await getActiveSeason();
  const playerId = params.id;

  const { data: player } = await supabase.from("players").select("id, display_name").eq("id", playerId).single();

  const { data: pr } = await supabase
    .from("player_ratings")
    .select("rating")
    .eq("season_id", season.id)
    .eq("player_id", playerId)
    .maybeSingle();

  const rating = pr?.rating ?? 1000;

  // rank
  const { data: top } = await supabase
    .from("player_ratings")
    .select("player_id, rating")
    .eq("season_id", season.id)
    .order("rating", { ascending: false })
    .limit(2000);

  const rank = top?.findIndex((r: any) => r.player_id === playerId);
  const rankLabel = rank === undefined || rank < 0 ? "—" : `#${rank + 1}`;

  // serie elo (season)
  const { data: hist } = await supabase
    .from("rating_history")
    .select("match_id, rating_after, matches(played_at)")
    .eq("season_id", season.id)
    .eq("player_id", playerId)
    .limit(4000);

  const series =
    (hist ?? [])
      .map((h: any) => ({ played_at: h.matches?.played_at, rating: h.rating_after }))
      .filter((x: any) => !!x.played_at)
      .sort((a: any, b: any) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime());

  // ultime partite (season)
  const { data: matches } = await supabase
    .from("matches")
    .select("id, played_at, player_a, player_b, score_a, score_b")
    .eq("season_id", season.id)
    .eq("status", "confirmed")
    .or(`player_a.eq.${playerId},player_b.eq.${playerId}`)
    .order("played_at", { ascending: false })
    .limit(10);

  const oppIds = new Set<string>();
  (matches ?? []).forEach((m: any) => {
    oppIds.add(m.player_a);
    oppIds.add(m.player_b);
  });
  const { data: oppPlayers } = oppIds.size
    ? await supabase.from("players").select("id, display_name").in("id", Array.from(oppIds))
    : { data: [] as any[] };

  const nameById = new Map((oppPlayers ?? []).map((p: any) => [p.id, p.display_name]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{player?.display_name ?? "Giocatore"} — {season.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-8">
          <div>
            <div className="text-xs opacity-70">Rank</div>
            <div className="text-2xl font-semibold">{rankLabel}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">Elo</div>
            <div className="text-2xl font-semibold">{rating}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Andamento Elo</CardTitle></CardHeader>
        <CardContent>
          <EloChart data={series as any} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ultime partite</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!matches?.length ? (
            <div className="text-sm opacity-70">Nessuna partita in questa stagione.</div>
          ) : (
            matches.map((m: any) => {
              const a = nameById.get(m.player_a) ?? m.player_a.slice(0, 8);
              const b = nameById.get(m.player_b) ?? m.player_b.slice(0, 8);
              return (
                <div key={m.id} className="border rounded-md p-3">
                  <div className="font-medium">{a} <span className="opacity-70">vs</span> {b}</div>
                  <div className="text-sm">{m.score_a} - {m.score_b}</div>
                  <div className="text-xs opacity-60">
                    {new Date(m.played_at).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
