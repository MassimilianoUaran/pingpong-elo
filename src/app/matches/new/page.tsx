"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Player = { id: string; display_name: string };

function nowDatetimeLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewMatchPage() {
  const supabase = createClient();

  const [players, setPlayers] = useState<Player[]>([]);
  const [opponent, setOpponent] = useState<string>("");

  const [scoreMe, setScoreMe] = useState<number>(11);
  const [scoreOpp, setScoreOpp] = useState<number>(7);

  const [playedAtLocal, setPlayedAtLocal] = useState<string>(nowDatetimeLocal());
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, display_name")
        .order("display_name", { ascending: true });

      if (error) setMsg(error.message);
      setPlayers((data ?? []) as Player[]);
    })();
  }, [supabase]);

  async function createMatch() {
    setMsg(null);
    setSaving(true);

    // datetime-local -> ISO (timestamptz)
    const playedIso = new Date(playedAtLocal).toISOString();

    const { data, error } = await supabase.rpc("create_match", {
      p_opponent: opponent,
      p_score_me: scoreMe,
      p_score_opp: scoreOpp,
      p_played_at: playedIso,
    });

    setSaving(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg(`Match creato (pending). ID: ${data}`);
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader><CardTitle>Nuova partita</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {msg && <p className="text-sm opacity-80">{msg}</p>}

          <div className="space-y-2">
            <Label>Avversario</Label>
            <select
              className="w-full border rounded-md p-2 bg-background"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
            >
              <option value="">Seleziona…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Data/ora partita</Label>
            <Input
              type="datetime-local"
              value={playedAtLocal}
              onChange={(e) => setPlayedAtLocal(e.target.value)}
            />
            <div className="text-xs opacity-60">
              Nota: per utenti normali max 48 ore nel passato.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tu</Label>
              <Input type="number" value={scoreMe} onChange={(e) => setScoreMe(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Avversario</Label>
              <Input type="number" value={scoreOpp} onChange={(e) => setScoreOpp(Number(e.target.value))} />
            </div>
          </div>

          <Button className="w-full" onClick={createMatch} disabled={!opponent || saving}>
            {saving ? "Salvataggio..." : "Salva (pending)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
