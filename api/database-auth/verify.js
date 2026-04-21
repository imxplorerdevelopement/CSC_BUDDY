import {
  buildSessionCookie,
  createSessionToken,
  getConfigErrors,
  getSessionTtlSeconds,
  readJsonBody,
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

  const sessionToken = createSessionToken();
  if (!sessionToken) {
    return res.status(500).json({ ok: false, message: "Unable to create database session." });
  }

  res.setHeader("Set-Cookie", buildSessionCookie(sessionToken));
  const expiresAt = new Date((Math.floor(Date.now() / 1000) + getSessionTtlSeconds()) * 1000).toISOString();
  return res.status(200).json({ ok: true, authenticated: true, expiresAt });
}
