import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- app_config helpers ---
// All three data types (tickets, services, quick_links) are stored as
// single JSONB rows in the app_config table keyed by name.

export async function dbLoad(key) {
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error(`[supabase] load "${key}" failed:`, error.message);
    return null;
  }
  return data?.value ?? null;
}

export async function dbSave(key, value) {
  const { error } = await supabase
    .from("app_config")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    console.error(`[supabase] save "${key}" failed:`, error.message);
  }
}
