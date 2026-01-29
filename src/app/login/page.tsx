"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit() {
    setMsg(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      setMsg(error ? error.message : "Registrazione ok. Controlla email se richiesto.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? error.message : "Login ok. Vai su /me");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
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
          <Button className="w-full" onClick={onSubmit}>
            {mode === "login" ? "Entra" : "Crea account"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
          </Button>
          {msg && <p className="text-sm opacity-80">{msg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
