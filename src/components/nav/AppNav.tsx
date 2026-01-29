import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let pendingCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("player_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.player_id) {
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .or(`player_a.eq.${profile.player_id},player_b.eq.${profile.player_id}`)
        .neq("created_by_player", profile.player_id);

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
            </>
          ) : (
            <>
              <Link className="hover:underline" href="/login">Login</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <form action="/auth/signout" method="post">
              <button className="border rounded-md px-3 py-2 hover:bg-black/5">
                Logout
              </button>
            </form>
          ) : (
            <span className="opacity-60">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
