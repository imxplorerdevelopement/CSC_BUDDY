import { createClient } from "@supabase/supabase-js";

const APP_CONFIG_TABLE = "app_config";
const ALLOWED_APP_CONFIG_KEYS = new Set([
  "tickets",
  "services",
  "quick_links",
  "b2b_ledger",
  "database_records",
  "appointments",
]);

function normalizeKey(key) {
  return String(key || "").trim();
}

export function isAllowedAppConfigKey(key) {
  return ALLOWED_APP_CONFIG_KEYS.has(normalizeKey(key));
}

export function normalizeAllowedKeys(keys) {
  if (!Array.isArray(keys)) return [];
  const normalized = [];
  const seen = new Set();
  keys.forEach((key) => {
    const value = normalizeKey(key);
    if (!isAllowedAppConfigKey(value) || seen.has(value)) return;
    seen.add(value);
    normalized.push(value);
  });
  return normalized;
}

export function getSupabaseConfigErrors() {
  const errors = [];
  if (!String(process.env.SUPABASE_URL || "").trim()) errors.push("SUPABASE_URL");
  if (!String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()) errors.push("SUPABASE_SERVICE_ROLE_KEY");
  return errors;
}

export function createServerSupabaseClient() {
  const url = String(process.env.SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function loadAppConfigValues(keys) {
  const allowedKeys = normalizeAllowedKeys(keys);
  if (allowedKeys.length === 0) return { ok: true, values: {} };

  const client = createServerSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Supabase server config is not available." };
  }

  const { data, error } = await client
    .from(APP_CONFIG_TABLE)
    .select("key,value")
    .in("key", allowedKeys);

  if (error) {
    return { ok: false, status: 500, message: error.message || "Unable to load app config." };
  }

  const values = allowedKeys.reduce((acc, key) => {
    acc[key] = null;
    return acc;
  }, {});
  (data || []).forEach((row) => {
    if (isAllowedAppConfigKey(row?.key)) {
      values[row.key] = row?.value ?? null;
    }
  });

  return { ok: true, values };
}

export async function saveAppConfigValue(key, value) {
  const allowedKey = normalizeKey(key);
  if (!isAllowedAppConfigKey(allowedKey)) {
    return { ok: false, status: 400, message: "Invalid app config key." };
  }

  const client = createServerSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Supabase server config is not available." };
  }

  const { error } = await client
    .from(APP_CONFIG_TABLE)
    .upsert({ key: allowedKey, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    return { ok: false, status: 500, message: error.message || "Unable to save app config." };
  }

  return { ok: true };
}
