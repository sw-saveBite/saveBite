import { createClient } from "@supabase/supabase-js";

import { env } from "./env.js";

const supabaseKey = env.supabaseServiceRoleKey || env.supabaseAnonKey;

if (!env.supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY are required.");
}

export const supabase = createClient(env.supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});
