import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default async function Leaderboard() {
  const supabase = createClient();
  const { data } = await supabase
    .from("v_leaderboard")
    .select("rank, display_name, rating")
    .order("rank", { ascending: true })
    .limit(50);

  return (
    <div className="p-6">
      <Card>
        <CardHeader><CardTitle>Classifica</CardTitle></CardHeader>
        <CardContent>
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
