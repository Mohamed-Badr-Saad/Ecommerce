import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "./server-env";

let client: SupabaseClient | undefined;

export function isSupabaseStorageConfigured() {
  return Boolean(serverEnv.NEXT_PUBLIC_SUPABASE_URL && serverEnv.SUPABASE_SECRET_KEY);
}

export function getSupabaseAdminClient() {
  if (!serverEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.SUPABASE_SECRET_KEY) {
    throw new Error("Supabase Storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }

  client ??= createClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

export const supabaseStorageBucket = serverEnv.SUPABASE_STORAGE_BUCKET;
