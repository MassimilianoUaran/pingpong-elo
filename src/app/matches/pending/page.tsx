import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PendingClient from "./pending-client";

export const dynamic = "force-dynamic";

type Player = { id: string; display_name: string };
type MatchRow = {
  id: string;
  played_at: string;
  created_at: string;
  created_by_player: string;
  player_a: string;
  player_b: string;
  score_a: number;
  score_b: number;
  status: string;
};

export default async function PendingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("player_id")
    .eq("user_id", user.id)
    .single();

  if (pErr || !profile?.player_id) {
    return (
      <div className="text-sm opacity-80">
        Profilo non collegato a un player. (Controlla tabella profiles / trigger signup)
      </div>
    );
  }

  const myPlayerId = profile.player_id;

  // Mappa giocatori (nome -> id)
  const { data: players } = await supabase
    .from("players")
    .select("id, display_name")
    .order("display_name", { ascending: true })
    .limit(1000);

  // Match pending che richiedono la TUA conferma:
  // - status pending
  // - tu sei uno dei due player
  // - ma non sei il creator (creator non può confermare secondo RPC)
  const { data: pending, error: mErr } = await supabase
    .from("matches")
    .select("id, played_at, created_at, created_by_player, player_a, player_b, score_a, score_b, status")
    .eq("status", "pending")
    .or(`player_a.eq.${myPlayerId},player_b.eq.${myPlayerId}`)
    .neq("created_by_player", myPlayerId)
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <PendingClient
      myPlayerId={myPlayerId}
      players={(players ?? []) as Player[]}
      initialPending={(pending ?? []) as MatchRow[]}
      initialError={mErr?.message ?? null}
    />
  );
}
