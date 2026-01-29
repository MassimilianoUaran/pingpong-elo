import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DisputedClient from "./disputed-client";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  played_at: string;
  created_at: string;
  player_a_id: string;
  player_a_name: string;
  player_b_id: string;
  player_b_name: string;
  score_a: number;
  score_b: number;
  disputed_reason: string | null;
};

export default async function DisputedPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("player_id, is_admin")
    .eq("user_id", user.id)
    .single();

  if (!me?.player_id) {
    return <div className="text-sm opacity-80">Profilo non collegato a un player.</div>;
  }

  let q = supabase
    .from("v_disputed_feed")
    .select("*")
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  // se non admin: mostra solo dispute dove sei coinvolto
  if (!me.is_admin) {
    q = q.or(`player_a_id.eq.${me.player_id},player_b_id.eq.${me.player_id}`);
  }

  const { data, error } = await q;

  return (
    <DisputedClient
      isAdmin={!!me.is_admin}
      rows={(data ?? []) as Row[]}
      initialError={error?.message ?? null}
    />
  );
}
