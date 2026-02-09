"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-3">
      <h1 className="text-xl font-semibold">Errore nella scheda giocatore</h1>
      <p className="text-sm opacity-80">
        Dettagli: <span className="font-mono">{error.message}</span>
      </p>
      <button className="border rounded-md px-3 py-2" onClick={() => reset()}>
        Riprova
      </button>
    </div>
  );
}
