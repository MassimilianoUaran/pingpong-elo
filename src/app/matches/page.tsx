import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MatchesClient from "./matches-client";

export const dynamic = "force-dynamic";

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

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: { player?: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const playerFilter = searchParams.player?.trim() || null;

  const { data: players } = await supabase
    .from("players")
    .select("id, display_name")
    .order("display_name", { ascending: true })
    .limit(2000);

  let q = supabase
    .from("v_match_feed")
    .select("*")
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (playerFilter) {
    q = q.or(`player_a_id.eq.${playerFilter},player_b_id.eq.${playerFilter}`);
  }

  const { data: matches, error } = await q;

  return (
    <MatchesClient
      players={(players ?? []) as Player[]}
      matches={(matches ?? []) as MatchFeedRow[]}
      initialError={error?.message ?? null}
      initialPlayer={playerFilter}
    />
  );
}
