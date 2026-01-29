import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import DisputedClient from "./disputed-client";

export const dynamic = "force-dynamic";

export default async function DisputedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const season = await getActiveSeason();

  const { data: profile } = await supabase
    .from("profiles")
    .select("player_id, is_admin")
    .eq("user_id", user.id)
    .single();

  if (!profile?.player_id) redirect("/login");

  const myPlayerId = profile.player_id as string;
  const isAdmin = !!profile.is_admin;

  let q = supabase
    .from("matches")
    .select("id, played_at, created_at, player_a, player_b, score_a, score_b, disputed_reason")
    .eq("season_id", season.id)
    .eq("status", "disputed")
    .order("played_at", { ascending: false });

  if (!isAdmin) {
    q = q.or(`player_a.eq.${myPlayerId},player_b.eq.${myPlayerId}`);
  }

  const { data: matches, error } = await q;

  const ids = new Set<string>();
  (matches ?? []).forEach((m: any) => {
    ids.add(m.player_a);
    ids.add(m.player_b);
  });

  const { data: players } = ids.size
    ? await supabase.from("players").select("id, display_name").in("id", Array.from(ids))
    : { data: [] as any[] };

  const nameById = new Map((players ?? []).map((p: any) => [p.id, p.display_name]));

  const rows = (matches ?? []).map((m: any) => ({
    id: m.id,
    played_at: m.played_at,
    created_at: m.created_at,
    player_a_id: m.player_a,
    player_a_name: nameById.get(m.player_a) ?? m.player_a.slice(0, 8),
    player_b_id: m.player_b,
    player_b_name: nameById.get(m.player_b) ?? m.player_b.slice(0, 8),
    score_a: m.score_a,
    score_b: m.score_b,
    disputed_reason: m.disputed_reason ?? null,
  }));

  return <DisputedClient isAdmin={isAdmin} rows={rows as any} initialError={error?.message ?? null} />;
}
