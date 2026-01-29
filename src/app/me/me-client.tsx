"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import EloChart from "@/components/me/EloChart";

type RecentMatch = {
  match_id: string;
  played_at: string;
  opponent_name: string;
  player_score: number;
  opponent_score: number;
  result: "W" | "L";
  delta: number | null;
};

type OppRow = {
  opponent_id: string;
  opponent_name: string;
  matches: number;
  wins: number;
  losses: number;
  winrate_pct: number;
};

export default function MeClient(props: {
  userId: string;
  playerId: string;

  displayName: string;
  avatarUrl: string | null;

  rank: number | null;
  rating: number;

  matchesPlayed: number;
  wins: number;
  losses: number;
  winratePct: number;

  pendingCount: number;

  last5Delta: number;
  eloSeries: { played_at: string; rating: number }[];

  recent: RecentMatch[];
  bestOpponent: OppRow | null;
  worstOpponent: OppRow | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(props.displayName);
  const [savingName, setSavingName] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const initials = useMemo(() => {
    const t = (props.displayName || "Me").trim();
    return t.slice(0, 2).toUpperCase();
  }, [props.displayName]);

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  async function saveDisplayName() {
    setMsg(null);
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 40) {
      setMsg("Il nome deve essere lungo 2–40 caratteri.");
      return;
    }

    setSavingName(true);
    const { error } = await supabase.rpc("update_my_display_name", { p_display_name: clean });
    setSavingName(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Nome aggiornato.");
    router.refresh(); // ricarica i dati server-side (leaderboard, /players, ecc.)
  }

  async function onAvatarSelected(file: File | null) {
    if (!file) return;
    setMsg(null);

    if (!file.type.startsWith("image/")) {
      setMsg("Seleziona un file immagine (png/jpg/webp).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMsg("Immagine troppo grande (max 2MB).");
      return;
    }

    setUploading(true);

    // Path: <userId>/avatar.png  (coerente con policy)
    const filePath = `${props.userId}/avatar.png`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (upErr) {
      setUploading(false);
      setMsg(upErr.message);
      return;
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // cache-busting
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: dbErr } = await supabase.rpc("update_my_avatar_url", { p_url: url });

    setUploading(false);

    if (dbErr) {
      setMsg(dbErr.message);
      return;
    }

    setMsg("Avatar aggiornato.");
    router.refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="settings">Impostazioni</TabsTrigger>
      </TabsList>

      {/* OVERVIEW */}
      <TabsContent value="overview" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Il mio profilo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={props.avatarUrl ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl font-semibold">{props.displayName}</div>
                <div className="text-sm opacity-70">
                  Rank: {props.rank ? `#${props.rank}` : "—"} • Elo: <b>{props.rating}</b>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-xs opacity-70">Winrate</div>
                <div className="text-2xl font-semibold">{props.winratePct}%</div>
                <div className="text-xs opacity-60">
                  W {props.wins} / L {props.losses} • tot {props.matchesPlayed}
                </div>
              </div>

              <div>
                <div className="text-xs opacity-70">Δ ultimi 5</div>
                <div className="text-2xl font-semibold">
                  {props.last5Delta > 0 ? `+${props.last5Delta}` : `${props.last5Delta}`}
                </div>
                <div className="text-xs opacity-60">Somma delta Elo ultime 5 partite</div>
              </div>

              <div>
                <div className="text-xs opacity-70">Da confermare</div>
                <div className="text-2xl font-semibold">{props.pendingCount}</div>
                <div className="text-xs opacity-60">
                  <a className="underline" href="/matches/pending">Apri inbox</a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Andamento Elo</CardTitle>
          </CardHeader>
          <CardContent>
            <EloChart data={props.eloSeries as any} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ultime partite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {props.recent.length === 0 ? (
                <div className="text-sm opacity-70">Nessuna partita.</div>
              ) : (
                props.recent.map((m) => (
                  <div key={m.match_id} className="border rounded-md p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{m.opponent_name}</div>
                      <div className="text-xs opacity-60">{fmt(m.played_at)}</div>
                      <div className="text-sm">
                        {m.player_score} - {m.opponent_score} • <b>{m.result}</b>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {m.delta == null ? "Δ ?" : (m.delta > 0 ? `+${m.delta}` : `${m.delta}`)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best / Worst opponent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs opacity-70 mb-2">Miglior avversario (winrate alto)</div>
                {props.bestOpponent ? (
                  <div className="border rounded-md p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{props.bestOpponent.opponent_name}</div>
                      <div className="text-xs opacity-60">
                        Match {props.bestOpponent.matches} • W {props.bestOpponent.wins} / L {props.bestOpponent.losses}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{props.bestOpponent.winrate_pct}%</div>
                  </div>
                ) : (
                  <div className="text-sm opacity-70">Dati insufficienti.</div>
                )}
              </div>

              <Separator />

              <div>
                <div className="text-xs opacity-70 mb-2">Peggior avversario (winrate basso)</div>
                {props.worstOpponent ? (
                  <div className="border rounded-md p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{props.worstOpponent.opponent_name}</div>
                      <div className="text-xs opacity-60">
                        Match {props.worstOpponent.matches} • W {props.worstOpponent.wins} / L {props.worstOpponent.losses}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{props.worstOpponent.winrate_pct}%</div>
                  </div>
                ) : (
                  <div className="text-sm opacity-70">Dati insufficienti.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* SETTINGS */}
      <TabsContent value="settings" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Impostazioni profilo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {msg && <div className="text-sm opacity-80">{msg}</div>}

            <div className="space-y-2">
              <div className="text-xs opacity-70">Nome visibile (leaderboard incluso)</div>
              <div className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
                <Button onClick={saveDisplayName} disabled={savingName}>
                  {savingName ? "..." : "Salva"}
                </Button>
              </div>
              <div className="text-xs opacity-60">
                Suggerimento: evita caratteri strani e nomi troppo lunghi.
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-xs opacity-70">Avatar</div>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={props.avatarUrl ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onAvatarSelected(e.target.files?.[0] ?? null)}
                    disabled={uploading}
                  />
                  <div className="text-xs opacity-60">
                    PNG/JPG/WEBP • max 2MB
                  </div>
                </div>
              </div>
              {uploading && <div className="text-sm opacity-70">Caricamento avatar…</div>}
            </div>

            <Separator />

            <div className="flex justify-between">
              <a className="underline text-sm" href="/matches/pending">Vai alle conferme</a>
              <Button variant="outline" onClick={signOut}>Logout</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
