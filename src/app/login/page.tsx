"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data.session) {
          toast.success("Registrazione completata");
          router.push("/me");
          router.refresh();
          return;
        }

        toast.info("Registrazione ok. Se la conferma email è attiva, controlla la mail; poi accedi.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Login effettuato");
      router.push("/me");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "login" ? "Accedi" : "Registrati"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label>Nome giocatore</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button className="w-full" onClick={onSubmit} disabled={loading}>
            {loading ? "..." : mode === "login" ? "Entra" : "Crea account"}
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            disabled={loading}
          >
            {mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
