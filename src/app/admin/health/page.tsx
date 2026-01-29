import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import RecalcClient from "./recalc-client";

export const dynamic = "force-dynamic";

async function countStatus(supabase: any, status: string) {
  const { count } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  return count ?? 0;
}

export default async function AdminHealthPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  if (!me?.is_admin) {
    return <div className="text-sm opacity-80">403 — Solo admin.</div>;
  }

  const [pending, disputed, confirmed, voided] = await Promise.all([
    countStatus(supabase, "pending"),
    countStatus(supabase, "disputed"),
    countStatus(supabase, "confirmed"),
    countStatus(supabase, "voided"),
  ]);

  const { data: events, error: eErr } = await supabase
    .from("event_log")
    .select("id, created_at, event_type, match_id, actor_user, details")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Admin • Health</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><div className="text-xs opacity-70">Pending</div><div className="text-2xl font-semibold">{pending}</div></div>
          <div><div className="text-xs opacity-70">Disputed</div><div className="text-2xl font-semibold">{disputed}</div></div>
          <div><div className="text-xs opacity-70">Confirmed</div><div className="text-2xl font-semibold">{confirmed}</div></div>
          <div><div className="text-xs opacity-70">Voided</div><div className="text-2xl font-semibold">{voided}</div></div>
        </CardContent>
      </Card>

      <RecalcClient />

      <Card>
        <CardHeader><CardTitle>Ultimi eventi</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {eErr && <div className="text-sm opacity-80">{eErr.message}</div>}
          {(events ?? []).length === 0 ? (
            <div className="text-sm opacity-70">Nessun evento.</div>
          ) : (
            <div className="space-y-2">
              {(events ?? []).map((ev: any) => (
                <div key={ev.id} className="border rounded-md p-3">
                  <div className="text-sm font-medium">
                    {ev.event_type} <span className="opacity-60">•</span>{" "}
                    <span className="text-xs opacity-60">{new Date(ev.created_at).toLocaleString("it-IT")}</span>
                  </div>
                  <div className="text-xs opacity-60">
                    match: {ev.match_id ? String(ev.match_id).slice(0, 8) + "…" : "—"} • user: {ev.actor_user ? String(ev.actor_user).slice(0, 8) + "…" : "—"}
                  </div>
                  <pre className="text-xs opacity-80 whitespace-pre-wrap mt-2">
{JSON.stringify(ev.details, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
