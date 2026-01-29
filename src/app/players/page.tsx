import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlayersClient from "./players-client";

export const dynamic = "force-dynamic";

type Row = {
  player_id: string;
  display_name: string;
  rating: number;
  rank: number;
};

export default async function PlayersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Usiamo la classifica come “directory” (ha già rating + rank)
  const { data, error } = await supabase
    .from("v_leaderboard")
    .select("player_id, display_name, rating, rank")
    .order("rank", { ascending: true })
    .limit(1000);

  return (
    <PlayersClient
      rows={(data ?? []) as Row[]}
      initialError={error?.message ?? null}
    />
  );
}
