"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
};

export default function MatchesClient(props: {
  seasonName: string;
  isAdmin: boolean;
  rows: Row[];
  initialError: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [voidOpen, setVoidOpen] = useState(false);
  const [voidId, setVoidId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  function openVoid(id: string) {
    setVoidId(id);
    setVoidReason("Errore inserimento / da rimuovere");
    setVoidOpen(true);
  }

  async function doVoid() {
    if (!voidId) return;

    setLoadingId(voidId);
    const { error } = await supabase.rpc("admin_void_match", {
      p_match_id: voidId,
      p_reason: voidReason,
    });
    setLoadingId(null);
    setVoidOpen(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Partita rimossa (void). Elo ricalcolato.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storico — {props.seasonName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.initialError && (
            <Alert>
              <AlertDescription>{props.initialError}</AlertDescription>
            </Alert>
          )}

          {props.rows.length === 0 ? (
            <div className="text-sm opacity-70">Nessuna partita confermata in questa stagione.</div>
          ) : (
            <div className="space-y-3">
              {props.rows.map((r) => {
                const isLoading = loadingId === r.id;
                return (
                  <div key={r.id} className="border rounded-md p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">
                        {r.player_a_name} <span className="opacity-70">vs</span> {r.player_b_name}
                      </div>
                      <div className="text-sm opacity-80">{r.score_a} - {r.score_b}</div>
                      <div className="text-xs opacity-60">Giocata: {fmt(r.played_at)}</div>
                    </div>

                    {props.isAdmin && (
                      <Button variant="outline" onClick={() => openVoid(r.id)} disabled={isLoading}>
                        {isLoading ? "..." : "Rimuovi (void)"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rimuovi partita (void)</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm opacity-80">
              La partita verrà marcata come <b>voided</b> e l’Elo verrà ricalcolato dal suo orario.
            </div>
            <Textarea value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVoidOpen(false)}>Annulla</Button>
            <Button onClick={doVoid} disabled={!voidId}>Conferma rimozione</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
