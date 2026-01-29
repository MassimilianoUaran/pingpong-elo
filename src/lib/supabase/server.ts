import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies(); // <-- FIX: cookies() è async

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // In Server Components non è affidabile settare cookie qui.
        // Ci pensa proxy.ts a mantenere la sessione “fresca”.
        setAll() {},
      },
    }
  );
}
