import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const season = await getActiveSeason();

  const { data: ratings } = await supabase
    .from("player_ratings")
    .select("player_id, rating")
    .eq("season_id", season.id)
    .order("rating", { ascending: false })
    .limit(500);

  const ids = (ratings ?? []).map((r) => r.player_id);
  const { data: players } = ids.length
    ? await supabase.from("players").select("id, display_name").in("id", ids)
    : { data: [] as any[] };

  const nameById = new Map((players ?? []).map((p: any) => [p.id, p.display_name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giocatori — {season.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!ratings?.length ? (
          <div className="text-sm opacity-70">Nessun giocatore in questa stagione.</div>
        ) : (
          ratings.map((r: any, idx: number) => (
            <div key={r.player_id} className="border rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 text-sm opacity-70">#{idx + 1}</div>
                <a className="font-medium underline" href={`/players/${r.player_id}`}>
                  {nameById.get(r.player_id) ?? r.player_id.slice(0, 8)}
                </a>
              </div>
              <div className="font-semibold">{r.rating}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
