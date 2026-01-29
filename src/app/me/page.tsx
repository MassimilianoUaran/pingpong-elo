import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MeClient from "./me-client";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, player_id")
    .eq("user_id", user.id)
    .single();

  if (pErr || !profile?.player_id) {
    return <div className="text-sm opacity-80">Profilo non trovato o non collegato a un player.</div>;
  }

  const playerId = profile.player_id;

  const { data: leaderboard } = await supabase
    .from("v_leaderboard")
    .select("rank, rating")
    .eq("player_id", playerId)
    .single();

  const { data: stats } = await supabase
    .from("v_player_stats")
    .select("matches_played, wins, losses, winrate_pct")
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
    .select("match_id, played_at, opponent_name, player_score, opponent_score, result, delta")
    .eq("player_id", playerId)
    .order("played_at", { ascending: false })
    .limit(10);

  const last5Delta =
    (recent ?? []).slice(0, 5).reduce((acc: number, r: any) => acc + (r.delta ?? 0), 0);

  // best/worst opponent (richiedi almeno 3 match per evitare “rumore”)
  const { data: bestOpp } = await supabase
    .from("v_player_opponents")
    .select("opponent_id, opponent_name, matches, wins, losses, winrate_pct")
    .eq("player_id", playerId)
    .gte("matches", 3)
    .order("winrate_pct", { ascending: false })
    .limit(1);

  const { data: worstOpp } = await supabase
    .from("v_player_opponents")
    .select("opponent_id, opponent_name, matches, wins, losses, winrate_pct")
    .eq("player_id", playerId)
    .gte("matches", 3)
    .order("winrate_pct", { ascending: true })
    .limit(1);

  // pending count
  const { count: pendingCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .or(`player_a.eq.${playerId},player_b.eq.${playerId}`)
    .neq("created_by_player", playerId);

  return (
    <MeClient
      userId={user.id}
      playerId={playerId}
      displayName={profile.display_name ?? "Me"}
      avatarUrl={profile.avatar_url ?? null}
      rank={leaderboard?.rank ?? null}
      rating={leaderboard?.rating ?? 1000}
      matchesPlayed={stats?.matches_played ?? 0}
      wins={stats?.wins ?? 0}
      losses={stats?.losses ?? 0}
      winratePct={stats?.winrate_pct ?? 0}
      pendingCount={pendingCount ?? 0}
      last5Delta={last5Delta}
      eloSeries={(series ?? []) as any}
      recent={(recent ?? []) as any}
      bestOpponent={(bestOpp?.[0] ?? null) as any}
      worstOpponent={(worstOpp?.[0] ?? null) as any}
    />
  );
}
