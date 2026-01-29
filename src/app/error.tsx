"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-2xl font-semibold">Errore</h1>
      <p className="opacity-80">
        Qualcosa è andato storto. {error?.digest ? `(digest: ${error.digest})` : ""}
      </p>
      <button className="underline" onClick={() => reset()}>
        Riprova
      </button>
    </div>
  );
}
