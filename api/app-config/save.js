import { getSupabaseConfigErrors, isAllowedAppConfigKey, saveAppConfigValue } from "../_lib/app_config.js";
import {
  clearSessionCookie,
  DATABASE_SESSION_COOKIE,
  parseCookies,
  readJsonBody,
  readSessionFromRequest,
} from "../_lib/database_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const session = readSessionFromRequest(req);
  if (!session.ok) {
    if (parseCookies(req)[DATABASE_SESSION_COOKIE]) {
      res.setHeader("Set-Cookie", clearSessionCookie());
    }
    const expired = session.reason === "expired";
    return res.status(401).json({
      ok: false,
      reason: expired ? "session_expired" : "unauthorized",
      message: expired ? "Database session expired." : "Database session required.",
    });
  }

  const configErrors = getSupabaseConfigErrors();
  if (configErrors.length > 0) {
    return res.status(500).json({ ok: false, message: "Supabase server config is not available." });
  }

  const body = await readJsonBody(req);
  const key = String(body?.key || "").trim();
  if (!isAllowedAppConfigKey(key)) {
    return res.status(400).json({ ok: false, message: "Invalid app config key." });
  }

  const result = await saveAppConfigValue(key, body?.value ?? null);
  if (!result.ok) {
    return res.status(result.status || 500).json({ ok: false, message: result.message || "Unable to save app config." });
  }

  return res.status(200).json({ ok: true });
}
