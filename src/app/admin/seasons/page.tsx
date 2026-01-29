import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSeasonsClient from "./seasons-client";

export const dynamic = "force-dynamic";

export default async function AdminSeasonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  if (!me?.is_admin) redirect("/me");

  const { data: seasons, error } = await supabase
    .from("seasons")
    .select("id, name, starts_at, ends_at, created_at")
    .order("starts_at", { ascending: false });

  return (
    <AdminSeasonsClient
      seasons={(seasons ?? []) as any}
      initialError={error?.message ?? null}
    />
  );
}
