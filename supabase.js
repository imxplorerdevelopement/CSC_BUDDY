import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// --- app_config helpers ---
// All three data types (tickets, services, quick_links) are stored as
// single JSONB rows in the app_config table keyed by name.

export async function dbLoad(key) {
  if (!supabase) {
    return { ok: false, value: null, reason: "disabled" };
  }
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error(`[supabase] load "${key}" failed:`, error.message);
    return { ok: false, value: null, reason: error.message };
  }
  return { ok: true, value: data?.value ?? null };
}

export async function dbSave(key, value) {
  if (!supabase) {
    return { ok: false, reason: "disabled" };
  }
  const { error } = await supabase
    .from("app_config")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    console.error(`[supabase] save "${key}" failed:`, error.message);
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}
