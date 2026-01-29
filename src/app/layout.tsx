import "./globals.css";

export const metadata = {
  title: "PingPong Elo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen">
        <div className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-3 flex gap-4 text-sm">
            <a className="hover:underline" href="/leaderboard">Classifica</a>
            <a className="hover:underline" href="/matches/new">Nuova partita</a>
            <a className="hover:underline" href="/me">Il mio profilo</a>
            <a className="hover:underline" href="/login">Login</a>
            <a className="hover:underline" href="/matches/pending">Da confermare</a>
          </div>
        </div>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
