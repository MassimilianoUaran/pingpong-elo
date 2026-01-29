// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies(); // <-- IMPORTANTISSIMO (await)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // In Server Components non puoi (in modo affidabile) settare cookie.
        // Ci pensa la proxy/middleware a mantenere fresca la sessione.
        setAll() {},
      },
    }
  );
}
