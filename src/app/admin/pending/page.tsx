import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import AdminPendingClient from "./pending-client";

export const dynamic = "force-dynamic";

export default async function AdminPendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  if (!me?.is_admin) redirect("/me");

  // stagione selezionata (cookie) come default
  const season = await getActiveSeason();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name")
    .order("starts_at", { ascending: false });

  // Pending della stagione selezionata
  const { data: pending, error } = await supabase
    .from("matches")
    .select("id, season_id, played_at, created_at, player_a, player_b, score_a, score_b, created_by_player")
    .eq("status", "pending")
    .eq("season_id", season.id)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  // Map nomi players
  const ids = new Set<string>();
  (pending ?? []).forEach((m: any) => {
    ids.add(m.player_a);
    ids.add(m.player_b);
    if (m.created_by_player) ids.add(m.created_by_player);
  });

  const { data: players } = ids.size
    ? await supabase.from("players").select("id, display_name").in("id", Array.from(ids))
    : { data: [] as any[] };

  const nameById = new Map((players ?? []).map((p: any) => [p.id, p.display_name]));

  const rows = (pending ?? []).map((m: any) => ({
    id: m.id,
    season_id: m.season_id,
    played_at: m.played_at,
    created_at: m.created_at,
    player_a_id: m.player_a,
    player_a_name: nameById.get(m.player_a) ?? m.player_a.slice(0, 8),
    player_b_id: m.player_b,
    player_b_name: nameById.get(m.player_b) ?? m.player_b.slice(0, 8),
    score_a: m.score_a,
    score_b: m.score_b,
    created_by_player: m.created_by_player,
    created_by_name: m.created_by_player ? (nameById.get(m.created_by_player) ?? m.created_by_player.slice(0, 8)) : "—",
  }));

  return (
    <AdminPendingClient
      seasons={(seasons ?? []) as any}
      currentSeasonId={season.id}
      currentSeasonName={season.name}
      rows={rows as any}
      initialError={error?.message ?? null}
    />
  );
}
