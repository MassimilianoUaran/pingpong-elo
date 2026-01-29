"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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

export default function PendingClient(props: {
  myPlayerId: string;
  players: Player[];
  initialPending: MatchRow[];
  initialError: string | null;
}) {
  const supabase = createClient();
  const { myPlayerId } = props;

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of props.players) m.set(p.id, p.display_name);
    return m;
  }, [props.players]);

  const [pending, setPending] = useState<MatchRow[]>(props.initialPending);
  const [msg, setMsg] = useState<string | null>(props.initialError);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  async function refetch() {
    const { data, error } = await supabase
      .from("matches")
      .select("id, played_at, created_at, created_by_player, player_a, player_b, score_a, score_b, status")
      .eq("status", "pending")
      .or(`player_a.eq.${myPlayerId},player_b.eq.${myPlayerId}`)
      .neq("created_by_player", myPlayerId)
      .order("played_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(error.message);
      return;
    }

    setPending((data ?? []) as MatchRow[]);
  }

  async function confirmMatch(id: string) {
    setMsg(null);
    setLoadingId(id);

    const { error } = await supabase.rpc("confirm_match", { p_match_id: id });

    setLoadingId(null);

    if (error) {
      setMsg(error.message);
      return;
    }

    // ricalcolo Elo avviene server-side; noi aggiorniamo la lista
    await refetch();
    setMsg("Confermato! Elo aggiornato.");
  }

  function openDispute(id: string) {
    setDisputeId(id);
    setDisputeReason("");
    setDisputeOpen(true);
  }

  async function submitDispute() {
    if (!disputeId) return;

    setMsg(null);
    setLoadingId(disputeId);

    const { error } = await supabase.rpc("dispute_match", {
      p_match_id: disputeId,
      p_reason: disputeReason,
    });

    setLoadingId(null);
    setDisputeOpen(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    await refetch();
    setMsg("Contestazione inviata.");
  }

  function fmtDate(iso: string) {
    try {
      return new Date(iso).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  function playerName(id: string) {
    return nameById.get(id) ?? id.slice(0, 8);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Partite da confermare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {msg && <div className="text-sm opacity-80">{msg}</div>}

          {pending.length === 0 ? (
            <div className="text-sm opacity-70">Nessuna partita in attesa della tua conferma.</div>
          ) : (
            <div className="space-y-3">
              {pending.map((m) => {
                const a = playerName(m.player_a);
                const b = playerName(m.player_b);
                const isLoading = loadingId === m.id;

                return (
                  <Card key={m.id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">
                          {a} <span className="opacity-70">vs</span> {b}
                        </div>
                        <Badge variant="secondary">pending</Badge>
                      </div>

                      <div className="text-sm opacity-80">
                        Risultato: <b>{m.score_a}</b> - <b>{m.score_b}</b>
                      </div>

                      <div className="text-xs opacity-60">
                        Giocata: {fmtDate(m.played_at)} • Inserita: {fmtDate(m.created_at)}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => confirmMatch(m.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? "..." : "Conferma"}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => openDispute(m.id)}
                          disabled={isLoading}
                        >
                          Contesta
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contesta partita</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm opacity-80">
              Inserisci un motivo (es. “punteggio invertito”, “partita non giocata”, “data errata”).
            </div>
            <Textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Motivo contestazione..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Annulla</Button>
            <Button onClick={submitDispute} disabled={!disputeId}>
              Invia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
