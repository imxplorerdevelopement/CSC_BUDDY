import { getSupabaseConfigErrors, loadAppConfigValues, normalizeAllowedKeys } from "../_lib/app_config.js";
import { readJsonBody, readSessionFromRequest } from "../_lib/database_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const session = readSessionFromRequest(req);
  if (!session.ok) {
    return res.status(401).json({ ok: false, message: "Database session required." });
  }

  const configErrors = getSupabaseConfigErrors();
  if (configErrors.length > 0) {
    return res.status(500).json({ ok: false, message: "Supabase server config is not available." });
  }

  const body = await readJsonBody(req);
  const keys = normalizeAllowedKeys(body?.keys);
  if (!Array.isArray(body?.keys) || keys.length !== body.keys.length) {
    return res.status(400).json({ ok: false, message: "Invalid app config keys." });
  }

  const result = await loadAppConfigValues(keys);
  if (!result.ok) {
    return res.status(result.status || 500).json({ ok: false, message: result.message || "Unable to load app config." });
  }

  return res.status(200).json({ ok: true, values: result.values });
}
