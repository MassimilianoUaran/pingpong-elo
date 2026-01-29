"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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

export default function DisputedClient(props: {
  isAdmin: boolean;
  rows: Row[];
  initialError: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [msg, setMsg] = useState<string | null>(props.initialError);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Void dialog
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidId, setVoidId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");

  // Correct dialog
  const [corrOpen, setCorrOpen] = useState(false);
  const [corrId, setCorrId] = useState<string | null>(null);
  const [corrScoreA, setCorrScoreA] = useState<number>(11);
  const [corrScoreB, setCorrScoreB] = useState<number>(7);
  const [corrPlayedAt, setCorrPlayedAt] = useState<string>(""); // datetime-local
  const [corrReason, setCorrReason] = useState("");

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  function toDatetimeLocal(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function adminVoid() {
    if (!voidId) return;
    setMsg(null);
    setLoadingId(voidId);

    const { error } = await supabase.rpc("admin_void_match", {
      p_match_id: voidId,
      p_reason: voidReason,
    });

    setLoadingId(null);
    setVoidOpen(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Partita annullata. Elo ricalcolato.");
    router.refresh();
  }

  function openVoid(id: string) {
    setVoidId(id);
    setVoidReason("");
    setVoidOpen(true);
  }

  function openCorrect(r: Row) {
    setCorrId(r.id);
    setCorrScoreA(r.score_a);
    setCorrScoreB(r.score_b);
    setCorrPlayedAt(toDatetimeLocal(r.played_at));
    setCorrReason("Correzione da disputa");
    setCorrOpen(true);
  }

  async function adminCorrect() {
    if (!corrId) return;
    setMsg(null);
    setLoadingId(corrId);

    // datetime-local -> Date in locale, convertiamo in ISO
    const playedIso = new Date(corrPlayedAt).toISOString();

    const { data, error } = await supabase.rpc("admin_correct_match", {
      p_match_id: corrId,
      p_new_score_a: corrScoreA,
      p_new_score_b: corrScoreB,
      p_new_played_at: playedIso,
      p_reason: corrReason,
    });

    setLoadingId(null);
    setCorrOpen(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg(`Corretto! Nuovo match: ${String(data).slice(0, 8)}… Elo ricalcolato.`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dispute</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {msg && <div className="text-sm opacity-80">{msg}</div>}

          {!props.isAdmin && (
            <div className="text-sm opacity-70">
              Stai vedendo solo le dispute che ti coinvolgono. La risoluzione è riservata agli admin.
            </div>
          )}

          {props.rows.length === 0 ? (
            <div className="text-sm opacity-70">Nessuna disputa aperta.</div>
          ) : (
            <div className="space-y-3">
              {props.rows.map((r) => {
                const isLoading = loadingId === r.id;
                return (
                  <Card key={r.id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">
                          {r.player_a_name} <span className="opacity-70">vs</span> {r.player_b_name}
                        </div>
                        <Badge variant="destructive">disputed</Badge>
                      </div>

                      <div className="text-sm">
                        Risultato inserito: <b>{r.score_a}</b> - <b>{r.score_b}</b>
                      </div>

                      <div className="text-xs opacity-60">
                        Giocata: {fmt(r.played_at)} • Inserita: {fmt(r.created_at)}
                      </div>

                      {r.disputed_reason && (
                        <div className="text-sm opacity-80 border rounded-md p-3">
                          <b>Motivo:</b> {r.disputed_reason}
                        </div>
                      )}

                      {props.isAdmin && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => openVoid(r.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? "..." : "Annulla (void)"}
                          </Button>

                          <Button
                            onClick={() => openCorrect(r)}
                            disabled={isLoading}
                          >
                            {isLoading ? "..." : "Correggi"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* VOID DIALOG */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annulla partita</DialogTitle>
          </DialogHeader>

          <Textarea
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="Motivo annullamento..."
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVoidOpen(false)}>Annulla</Button>
            <Button onClick={adminVoid} disabled={!voidId}>
              Conferma void
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CORRECT DIALOG */}
      <Dialog open={corrOpen} onOpenChange={setCorrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correggi partita</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs opacity-70">Score A</div>
                <Input type="number" value={corrScoreA} onChange={(e) => setCorrScoreA(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <div className="text-xs opacity-70">Score B</div>
                <Input type="number" value={corrScoreB} onChange={(e) => setCorrScoreB(Number(e.target.value))} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs opacity-70">Played at</div>
              <Input type="datetime-local" value={corrPlayedAt} onChange={(e) => setCorrPlayedAt(e.target.value)} />
            </div>

            <div className="space-y-1">
              <div className="text-xs opacity-70">Motivo</div>
              <Textarea value={corrReason} onChange={(e) => setCorrReason(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCorrOpen(false)}>Annulla</Button>
            <Button onClick={adminCorrect} disabled={!corrId}>
              Applica correzione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
