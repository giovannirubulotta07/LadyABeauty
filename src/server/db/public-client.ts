import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/server/env";
import type { Database } from "./database.types";

/**
 * Stateless client with the publishable key: reads only what RLS exposes to
 * anonymous visitors (catalogue, business info, gallery). Safe inside
 * `use cache` because it never touches cookies.
 */
export function createPublicClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
