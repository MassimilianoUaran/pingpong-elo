import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_leaderboard")
    .select("rank, display_name, rating")
    .order("rank", { ascending: true })
    .limit(50);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Classifica</CardTitle></CardHeader>
        <CardContent>
          {error && <p className="text-sm opacity-80">{error.message}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Giocatore</TableHead>
                <TableHead>Elo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((r) => (
                <TableRow key={`${r.rank}-${r.display_name}`}>
                  <TableCell>{r.rank}</TableCell>
                  <TableCell>{r.display_name}</TableCell>
                  <TableCell>{r.rating}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
