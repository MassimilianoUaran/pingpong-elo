import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/season/server";
import SeasonSwitcher from "@/components/nav/SeasonSwitcher";

export const dynamic = "force-dynamic";

export default async function SeasonBar() {
  const supabase = await createClient();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name")
    .order("starts_at", { ascending: false });

  if (!seasons?.length) return null;

  const current = await getActiveSeason();

  return (
    <div className="border rounded-md p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm">
        Stagione selezionata: <b>{current.name}</b>
      </div>
      <SeasonSwitcher seasons={seasons as any} currentId={current.id} />
    </div>
  );
}
