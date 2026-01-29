"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function nowMinusHoursLocal(h: number) {
  const d = new Date(Date.now() - h * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RecalcClient() {
  const supabase = createClient();
  const router = useRouter();

  const [from, setFrom] = useState(nowMinusHoursLocal(24));
  const [msg, setMsg] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setMsg(null);
    setRunning(true);

    const iso = new Date(from).toISOString();
    const { error } = await supabase.rpc("admin_recalc_from_time", { p_from: iso });

    setRunning(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Ricalcolo avviato/completato. (Controlla leaderboard e log eventi)");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Ricalcolo Elo (admin)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {msg && <div className="text-sm opacity-80">{msg}</div>}
        <div className="text-xs opacity-70">Ricalcola a partire da:</div>
        <div className="flex flex-wrap gap-2 items-center">
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Button onClick={run} disabled={running}>{running ? "..." : "Recalc"}</Button>
        </div>
        <div className="text-xs opacity-60">
          Usa solo in emergenza (o dopo correzioni massicce). Strategia 2 = ricalcolo “dal punto in poi”.
        </div>
      </CardContent>
    </Card>
  );
}
