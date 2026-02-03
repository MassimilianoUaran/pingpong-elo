import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import SeasonSwitcher from "./SeasonSwitcher";

export const dynamic = "force-dynamic";

export default async function AppNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const seasonsRes = await supabase
    .from("seasons")
    .select("id, name")
    .order("starts_at", { ascending: false });

  const seasons = (seasonsRes.data ?? []) as { id: string; name: string }[];

  const currentSeason = seasons.length ? await getActiveSeason() : null;

  let pendingCount = 0;
  let isAdmin = false;
  let myPlayerId: string | null = null;

  if (user && currentSeason) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("player_id, is_admin")
      .eq("user_id", user.id)
      .single();

    myPlayerId = profile?.player_id ?? null;
    isAdmin = !!profile?.is_admin;

    if (myPlayerId) {
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("season_id", currentSeason.id)
        .eq("status", "pending")
        .or(`player_a.eq.${myPlayerId},player_b.eq.${myPlayerId}`)
        .neq("created_by_player", myPlayerId);

      pendingCount = count ?? 0;
    }
  }

  return (
    <div className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4 text-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <Link className="hover:underline" href="/">Home</Link>

          {user ? (
            <>
              <Link className="hover:underline" href="/me">Il mio profilo</Link>
              <Link className="hover:underline" href="/leaderboard">Classifica</Link>
              <Link className="hover:underline" href="/players">Giocatori</Link>
              <Link className="hover:underline" href="/matches">Storico</Link>
              <Link className="hover:underline" href="/matches/new">Nuova partita</Link>

              <Link className="hover:underline flex items-center gap-2" href="/matches/pending">
                Da confermare
                {pendingCount > 0 && (
                  <span className="text-xs border rounded-full px-2 py-0.5">
                    {pendingCount}
                  </span>
                )}
              </Link>

              <Link className="hover:underline" href="/matches/disputed">Dispute</Link>

              {isAdmin && (
                <>
                <Link className="hover:underline" href="/admin/seasons">Admin stagioni</Link>
                <Link className="hover:underline" href="/admin/pending">Admin pending</Link>
                </>
              )}
            </>
          ) : (
            <Link className="hover:underline" href="/login">Login</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!!user && currentSeason && seasons.length > 0 && (
            <SeasonSwitcher seasons={seasons} currentId={currentSeason.id} />
          )}

          {user ? (
            <form action="/auth/signout" method="post">
              <button className="border rounded-md px-3 py-2 hover:bg-black/5">Logout</button>
            </form>
          ) : (
            <span className="opacity-60">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
