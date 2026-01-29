import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import MatchesClient from "./matches-client";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  played_at: string;
  created_at: string;
  player_a_id: string;
  player_a_name: string;
  player_b_id: string;
  player_b_name: string;
  score_a: number;
  score_b: number;
};

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const season = await getActiveSeason();

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, played_at, created_at, player_a, player_b, score_a, score_b")
    .eq("season_id", season.id)
    .eq("status", "confirmed")
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const ids = new Set<string>();
  (matches ?? []).forEach((m: any) => {
    ids.add(m.player_a);
    ids.add(m.player_b);
  });

  const { data: players } = ids.size
    ? await supabase.from("players").select("id, display_name").in("id", Array.from(ids))
    : { data: [] as any[] };

  const nameById = new Map((players ?? []).map((p: any) => [p.id, p.display_name]));

  const rows: Row[] = (matches ?? []).map((m: any) => ({
    id: m.id,
    played_at: m.played_at,
    created_at: m.created_at,
    score_a: m.score_a,
    score_b: m.score_b,
    player_a_id: m.player_a,
    player_a_name: nameById.get(m.player_a) ?? m.player_a.slice(0, 8),
    player_b_id: m.player_b,
    player_b_name: nameById.get(m.player_b) ?? m.player_b.slice(0, 8),
  }));

  return (
    <MatchesClient
      seasonName={season.name}
      isAdmin={!!me?.is_admin}
      rows={rows}
      initialError={error?.message ?? null}
    />
  );
}
