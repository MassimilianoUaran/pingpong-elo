import "./globals.css";
import AppNav from "@/components/nav/AppNav";
import { Toaster } from "@/components/ui/sonner";

export const metadata = { title: "PingPong Elo" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-6xl p-4">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
