import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import EloChart from "@/components/me/EloChart";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, player_id")
    .eq("user_id", user.id)
    .single();

  if (pErr || !profile?.player_id) {
    return (
      <Card>
        <CardHeader><CardTitle>Profilo</CardTitle></CardHeader>
        <CardContent className="text-sm opacity-80">
          Profilo non trovato o non collegato a un player.
        </CardContent>
      </Card>
    );
  }

  const { data: ratingRow } = await supabase
    .from("player_ratings")
    .select("rating")
    .eq("player_id", profile.player_id)
    .single();

  const { data: series } = await supabase
    .from("v_player_elo_series")
    .select("played_at, rating")
    .eq("player_id", profile.player_id)
    .order("played_at", { ascending: true })
    .limit(250);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{profile.display_name ?? "Il mio profilo"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-lg">
            Elo: <b>{ratingRow?.rating ?? 1000}</b>
          </div>
          <div className="text-sm opacity-70">
            Serie Elo (max 250 punti)
          </div>
          <EloChart data={(series ?? []) as any} />
        </CardContent>
      </Card>
    </div>
  );
}
