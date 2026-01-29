import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import PendingClient from "./pending-client";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const season = await getActiveSeason();

  const { data: profile } = await supabase
    .from("profiles")
    .select("player_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.player_id) redirect("/login");

  const myPlayerId = profile.player_id as string;

  const { data: players } = await supabase
    .from("players")
    .select("id, display_name")
    .order("display_name", { ascending: true });

  const { data: pending, error } = await supabase
    .from("matches")
    .select("id, played_at, created_at, created_by_player, player_a, player_b, score_a, score_b, status")
    .eq("season_id", season.id)
    .eq("status", "pending")
    .or(`player_a.eq.${myPlayerId},player_b.eq.${myPlayerId}`)
    .neq("created_by_player", myPlayerId)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <PendingClient
      myPlayerId={myPlayerId}
      players={(players ?? []) as any}
      initialPending={(pending ?? []) as any}
      initialError={error?.message ?? null}
    />
  );
}
