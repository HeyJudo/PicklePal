import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser-side Supabase client using the anon/public key.
 * Safe to use in client components — only has public read access via RLS.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables",
    );
  }

  return createClient<Database>(url, anonKey);
}
