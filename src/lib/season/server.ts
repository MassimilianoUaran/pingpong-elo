import { createClient } from "@/lib/supabase/server";

export type Season = { id: string; name: string; starts_at: string; ends_at: string | null };

export async function getActiveSeason(): Promise<Season> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("seasons")
    .select("id, name, starts_at, ends_at")
    .lte("starts_at", nowIso)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order("starts_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) throw new Error("No active season configured");
  return data as Season;
}
