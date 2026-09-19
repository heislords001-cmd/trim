"use client";

import { createBrowserClient } from "@supabase/ssr";

// One browser client, reused across client components.
//
// Deliberately untyped (no <Database> generic): supabase-js's generic
// select-string parser needs full, correctly-shaped Relationships
// metadata to work, and a hand-written Database type without a real
// `supabase gen types` run keeps breaking that parser in ways that
// shift with every supabase-js patch release (see the git history on
// this file for the saga). Our own action functions already declare
// explicit return types, which is where the actual type safety that
// matters lives — this client being loosely typed doesn't change that.
// Once you've run `npm run supabase:types` against a real project,
// swap the generic back in: createBrowserClient<Database>(...).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
