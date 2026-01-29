import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export default async function MePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, player_id")
    .eq("user_id", user.id)
    .single();

  const { data: ratingRow } = await supabase
    .from("player_ratings")
    .select("rating")
    .eq("player_id", profile?.player_id)
    .single();

  const { data: series } = await supabase
    .from("v_player_elo_series")
    .select("played_at, rating")
    .eq("player_id", profile?.player_id)
    .order("played_at", { ascending: true })
    .limit(200);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{profile?.display_name ?? "Me"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-lg">Elo: <b>{ratingRow?.rating ?? 1000}</b></div>
          <div className="text-sm opacity-70">Partite in serie (ultime 200): {series?.length ?? 0}</div>
        </CardContent>
      </Card>

      {/* Grafico: lo aggiungiamo nel passo successivo (Recharts) */}
    </div>
  );
}
