import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import MeClient from "./me-client";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const season = await getActiveSeason();

  const { data: profile } = await supabase
    .from("profiles")
    .select("player_id, display_name, avatar_url")
    .eq("user_id", user.id)
    .single();

  if (!profile?.player_id) redirect("/login");

  const myPlayerId = profile.player_id as string;

  // rating attuale (stagione)
  const { data: pr } = await supabase
    .from("player_ratings")
    .select("rating")
    .eq("season_id", season.id)
    .eq("player_id", myPlayerId)
    .maybeSingle();

  const rating = pr?.rating ?? 1000;

  // rank (stagione)
  const { data: top } = await supabase
    .from("player_ratings")
    .select("player_id, rating")
    .eq("season_id", season.id)
    .order("rating", { ascending: false })
    .limit(5000);

  const rankIdx = top?.findIndex((r: any) => r.player_id === myPlayerId) ?? -1;
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;

  // pending count (stagione)
  const { count: pendingCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("season_id", season.id)
    .eq("status", "pending")
    .or(`player_a.eq.${myPlayerId},player_b.eq.${myPlayerId}`)
    .neq("created_by_player", myPlayerId);

  // confirmed matches (stagione)
  const { data: matches } = await supabase
    .from("matches")
    .select("id, played_at, player_a, player_b, score_a, score_b")
    .eq("season_id", season.id)
    .eq("status", "confirmed")
    .or(`player_a.eq.${myPlayerId},player_b.eq.${myPlayerId}`)
    .order("played_at", { ascending: false })
    .limit(2000);

  const all = matches ?? [];
  let wins = 0, losses = 0;

  for (const m of all as any[]) {
    const iAmA = m.player_a === myPlayerId;
    const myScore = iAmA ? m.score_a : m.score_b;
    const oppScore = iAmA ? m.score_b : m.score_a;
    if (myScore > oppScore) wins++; else losses++;
  }

  const matchesPlayed = wins + losses;
  const winratePct = matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0;

  // elo series (stagione)
  const { data: hist } = await supabase
    .from("rating_history")
    .select("match_id, rating_after, matches(played_at)")
    .eq("season_id", season.id)
    .eq("player_id", myPlayerId)
    .limit(4000);

  const eloSeries =
    (hist ?? [])
      .map((h: any) => ({ played_at: h.matches?.played_at, rating: h.rating_after }))
      .filter((x: any) => !!x.played_at)
      .sort((a: any, b: any) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime());

  // recent 10 + delta (stagione)
  const recentMatches = (all as any[]).slice(0, 10);
  const recentIds = recentMatches.map((m) => m.id);

  const { data: deltas } = recentIds.length
    ? await supabase
        .from("rating_history")
        .select("match_id, delta")
        .eq("season_id", season.id)
        .eq("player_id", myPlayerId)
        .in("match_id", recentIds)
    : { data: [] as any[] };

  const deltaByMatch = new Map((deltas ?? []).map((d: any) => [d.match_id, d.delta]));

  // opponent names
  const oppIds = new Set<string>();
  for (const m of recentMatches) {
    oppIds.add(m.player_a);
    oppIds.add(m.player_b);
  }
  const { data: oppPlayers } = oppIds.size
    ? await supabase.from("players").select("id, display_name").in("id", Array.from(oppIds))
    : { data: [] as any[] };

  const nameById = new Map((oppPlayers ?? []).map((p: any) => [p.id, p.display_name]));

  const recent = recentMatches.map((m: any) => {
    const iAmA = m.player_a === myPlayerId;
    const oppId = iAmA ? m.player_b : m.player_a;
    const myScore = iAmA ? m.score_a : m.score_b;
    const oppScore = iAmA ? m.score_b : m.score_a;
    const result = myScore > oppScore ? "W" : "L";
    return {
      match_id: m.id,
      played_at: m.played_at,
      opponent_name: nameById.get(oppId) ?? oppId.slice(0, 8),
      player_score: myScore,
      opponent_score: oppScore,
      result,
      delta: deltaByMatch.get(m.id) ?? null,
    };
  });

  // last5Delta
  const last5Delta = recent.slice(0, 5).reduce((acc: number, r: any) => acc + (r.delta ?? 0), 0);

  // best/worst opponent (stagione) — minimo: da all[] in JS
  type Agg = { opponent_id: string; opponent_name: string; matches: number; wins: number; losses: number };
  const agg = new Map<string, Agg>();

  for (const m of all as any[]) {
    const iAmA = m.player_a === myPlayerId;
    const oppId = iAmA ? m.player_b : m.player_a;
    const myScore = iAmA ? m.score_a : m.score_b;
    const oppScore = iAmA ? m.score_b : m.score_a;

    const a = agg.get(oppId) ?? {
      opponent_id: oppId,
      opponent_name: nameById.get(oppId) ?? oppId.slice(0, 8),
      matches: 0,
      wins: 0,
      losses: 0,
    };

    a.matches++;
    if (myScore > oppScore) a.wins++; else a.losses++;
    agg.set(oppId, a);
  }

  const oppStats = Array.from(agg.values()).map((a) => ({
    ...a,
    winrate_pct: a.matches ? Math.round((a.wins / a.matches) * 100) : 0,
  }));

  // richiedi un minimo di match per non “sparare” conclusioni su 1 partita
  const filtered = oppStats.filter((o) => o.matches >= 3);
  const bestOpponent = filtered.sort((x, y) => y.winrate_pct - x.winrate_pct)[0] ?? null;
  const worstOpponent = filtered.sort((x, y) => x.winrate_pct - y.winrate_pct)[0] ?? null;

  return (
    <MeClient
      userId={user.id}
      playerId={myPlayerId}
      displayName={profile.display_name}
      avatarUrl={profile.avatar_url}
      rank={rank}
      rating={rating}
      matchesPlayed={matchesPlayed}
      wins={wins}
      losses={losses}
      winratePct={winratePct}
      pendingCount={pendingCount ?? 0}
      last5Delta={last5Delta}
      eloSeries={eloSeries as any}
      recent={recent as any}
      bestOpponent={bestOpponent as any}
      worstOpponent={worstOpponent as any}
    />
  );
}
