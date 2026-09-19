import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side client for Server Components, Server Actions and Route
// Handlers. Reads/writes the session via Next's cookie store so RLS sees
// the real user.
//
// Deliberately untyped — see the comment in lib/supabase/client.ts for why.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no request context to write to.
            // Safe to ignore as long as middleware.ts is refreshing sessions.
          }
        }
      }
    }
  );
}
