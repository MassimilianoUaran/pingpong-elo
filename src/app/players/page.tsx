import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import SeasonBar from "@/components/season/SeasonBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function PlayersPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const season = await getActiveSeason();

  const q = (searchParams?.q ?? "").trim();
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("v_season_leaderboard")
    .select("player_id, display_name, rating", { count: "exact" })
    .eq("season_id", season.id)
    .order("rating", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("display_name", `%${q}%`);

  const { data, error, count } = await query;

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const mkLink = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("page", String(p));
    return `/players?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <SeasonBar />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle>Giocatori</CardTitle>

          <form className="flex gap-2" action="/players" method="get">
            <Input name="q" placeholder="Cerca giocatore..." defaultValue={q} className="w-[240px]" />
            <Button type="submit" variant="outline">Cerca</Button>
          </form>
        </CardHeader>

        <CardContent className="space-y-3">
          {error && <div className="text-sm opacity-80">{error.message}</div>}

          {!data?.length ? (
            <div className="text-sm opacity-70">Nessun risultato.</div>
          ) : (
            <div className="space-y-2">
              {data.map((r: any, idx: number) => (
                <div key={r.player_id} className="border rounded-md p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-sm opacity-70">#{from + idx + 1}</div>
                    <a className="font-medium underline" href={`/players/${r.player_id}`}>
                      {r.display_name}
                    </a>
                  </div>
                  <div className="font-semibold">{r.rating}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <a
              className={`text-sm underline ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
              href={mkLink(page - 1)}
            >
              ← Precedente
            </a>

            <div className="text-xs opacity-70">
              Pagina {page} / {totalPages} • risultati: {total}
            </div>

            <a
              className={`text-sm underline ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
              href={mkLink(page + 1)}
            >
              Successiva →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
