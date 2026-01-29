"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type Row = {
  player_id: string;
  display_name: string;
  rating: number;
  rank: number;
};

export default function PlayersClient(props: { rows: Row[]; initialError: string | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return props.rows;
    return props.rows.filter(r => r.display_name.toLowerCase().includes(s));
  }, [q, props.rows]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Giocatori</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.initialError && <div className="text-sm opacity-80">{props.initialError}</div>}

          <Input
            placeholder="Cerca giocatore…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Giocatore</TableHead>
                <TableHead>Elo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.player_id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/players/${r.player_id}`)}
                >
                  <TableCell>{r.rank}</TableCell>
                  <TableCell className="font-medium">{r.display_name}</TableCell>
                  <TableCell>{r.rating}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="text-xs opacity-60">
            Totale: {filtered.length} / {props.rows.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
