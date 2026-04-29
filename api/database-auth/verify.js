import {
  buildSessionCookie,
  consumeGateAttempt,
  createSessionToken,
  getConfigErrors,
  getSessionTtlSeconds,
  readJsonBody,
  resetGateAttempts,
  verifyCredentials,
} from "../_lib/database_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const configErrors = getConfigErrors();
  if (configErrors.length > 0) {
    return res.status(500).json({
      ok: false,
      message: "Database security is not configured on server.",
    });
  }

  const rateLimit = await consumeGateAttempt(req);
  if (!rateLimit.ok) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))));
    return res.status(429).json({
      ok: false,
      message: "Too many verification attempts. Please wait before trying again.",
    });
  }

  const body = await readJsonBody(req);
  const verifyResult = verifyCredentials({
    securityCode: body?.securityCode,
    authenticatorCode: body?.authenticatorCode,
  });

  if (!verifyResult.ok) {
    return res.status(401).json({
      ok: false,
      message: "Invalid security code or authenticator code.",
    });
  }

  await resetGateAttempts(req);
  const sessionToken = createSessionToken(req);
  if (!sessionToken) {
    return res.status(500).json({ ok: false, message: "Unable to create database session." });
  }

  res.setHeader("Set-Cookie", buildSessionCookie(sessionToken));
  const expiresAt = new Date((Math.floor(Date.now() / 1000) + getSessionTtlSeconds()) * 1000).toISOString();
  return res.status(200).json({ ok: true, authenticated: true, expiresAt });
}
