"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Player = { id: string; display_name: string };

export default function NewMatchPage() {
  const supabase = createClient();
  const [players, setPlayers] = useState<Player[]>([]);
  const [opponent, setOpponent] = useState<string>("");
  const [scoreMe, setScoreMe] = useState<number>(11);
  const [scoreOpp, setScoreOpp] = useState<number>(7);
  const [msg, setMsg] = useState<string | null>(null);

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
    const { data, error } = await supabase.rpc("create_match", {
      p_opponent: opponent,
      p_score_me: scoreMe,
      p_score_opp: scoreOpp,
      // p_played_at: new Date().toISOString(), // se vuoi passarlo esplicitamente
    });

    if (error) setMsg(error.message);
    else setMsg(`Match creato (pending). ID: ${data}`);
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader><CardTitle>Nuova partita</CardTitle></CardHeader>
        <CardContent className="space-y-4">
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

          <Button className="w-full" onClick={createMatch} disabled={!opponent}>
            Salva (pending)
          </Button>

          {msg && <p className="text-sm opacity-80">{msg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
