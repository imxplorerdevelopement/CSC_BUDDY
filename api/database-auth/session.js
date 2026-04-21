import {
  clearSessionCookie,
  parseCookies,
  readSessionFromRequest,
  DATABASE_SESSION_COOKIE,
} from "../_lib/database_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const cookies = parseCookies(req);
  const token = cookies[DATABASE_SESSION_COOKIE] || "";
  const session = readSessionFromRequest(req);

  if (!session.ok) {
    if (token) {
      res.setHeader("Set-Cookie", clearSessionCookie());
    }
    return res.status(200).json({ ok: true, authenticated: false });
  }

  return res.status(200).json({
    ok: true,
    authenticated: true,
    expiresAt: new Date(session.payload.exp * 1000).toISOString(),
  });
}
