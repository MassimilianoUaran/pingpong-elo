"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Point = { played_at: string; rating: number };

export default function EloChart({ data }: { data: Point[] }) {
  if (!data?.length) return <div className="text-sm opacity-70">Nessun dato Elo disponibile.</div>;

  const chartData = data.map((p) => ({
    date: new Date(p.played_at).toLocaleDateString("it-IT"),
    rating: p.rating,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 12 }} width={40} />
          <Tooltip />
          <Line type="monotone" dataKey="rating" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
