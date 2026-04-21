import crypto from "node:crypto";

export const DATABASE_SESSION_COOKIE = "csc_db_auth";

const DEFAULT_SESSION_TTL_MINUTES = 15;
const MIN_SESSION_TTL_MINUTES = 5;
const MAX_SESSION_TTL_MINUTES = 240;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeOtp(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 6);
}

function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left ?? ""), "utf8");
  const b = Buffer.from(String(right ?? ""), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseHashValue(rawHash) {
  const value = normalizeText(rawHash).toLowerCase();
  if (!value) return null;
  if (value.startsWith("sha256:")) {
    const digest = value.slice("sha256:".length).trim();
    if (/^[a-f0-9]{64}$/.test(digest)) return { algo: "sha256", digest };
    return null;
  }
  if (/^[a-f0-9]{64}$/.test(value)) return { algo: "sha256", digest: value };
  return null;
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");
}

function matchesHash(input, storedHash) {
  const parsed = parseHashValue(storedHash);
  if (!parsed) return false;
  if (parsed.algo !== "sha256") return false;
  const computed = sha256Hex(input);
  return constantTimeEqual(computed, parsed.digest);
}

function decodeBase32(secret) {
  const cleaned = normalizeText(secret).toUpperCase().replace(/[^A-Z2-7]/g, "");
  if (!cleaned) return Buffer.alloc(0);
  let bits = "";
  for (let i = 0; i < cleaned.length; i += 1) {
    const value = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (value < 0) continue;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTotp(secret, counter) {
  const secretBuffer = decodeBase32(secret);
  if (secretBuffer.length === 0) return "";
  const counterBuffer = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuffer.writeUInt32BE(high, 0);
  counterBuffer.writeUInt32BE(low, 4);
  const hash = crypto.createHmac("sha1", secretBuffer).update(counterBuffer).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24)
    | ((hash[offset + 1] & 0xff) << 16)
    | ((hash[offset + 2] & 0xff) << 8)
    | (hash[offset + 3] & 0xff);
  const code = binary % 1000000;
  return String(code).padStart(6, "0");
}

function verifyTotpCode(codeInput) {
  const code = normalizeOtp(codeInput);
  const secret = normalizeText(process.env.DB_TOTP_SECRET);
  if (!secret || code.length !== 6) return false;
  const nowCounter = Math.floor(Date.now() / 30000);
  for (let delta = -1; delta <= 1; delta += 1) {
    if (generateTotp(secret, nowCounter + delta) === code) {
      return true;
    }
  }
  return false;
}

function verifySecurityCode(codeInput) {
  const code = normalizeText(codeInput);
  if (!code) return false;
  const hash = normalizeText(process.env.DB_SECURITY_CODE_HASH);
  if (hash) return matchesHash(code, hash);
  const plain = normalizeText(process.env.DB_SECURITY_CODE);
  if (plain) return constantTimeEqual(code, plain);
  return false;
}

function verifyBackupCode(codeInput) {
  const code = normalizeOtp(codeInput);
  if (code.length !== 6) return false;
  const hash = normalizeText(process.env.DB_BACKUP_CODE_HASH);
  if (hash) return matchesHash(code, hash);
  const plain = normalizeOtp(process.env.DB_BACKUP_CODE);
  if (plain) return constantTimeEqual(code, plain);
  return false;
}

function verifySecondFactor(codeInput) {
  if (normalizeText(process.env.DB_TOTP_SECRET)) {
    return verifyTotpCode(codeInput);
  }
  return verifyBackupCode(codeInput);
}

function getSessionSecret() {
  return normalizeText(process.env.DB_SESSION_SECRET);
}

export function getSessionTtlSeconds() {
  const minutes = Number(process.env.DB_SESSION_TTL_MINUTES);
  const bounded = Number.isFinite(minutes)
    ? Math.min(MAX_SESSION_TTL_MINUTES, Math.max(MIN_SESSION_TTL_MINUTES, Math.floor(minutes)))
    : DEFAULT_SESSION_TTL_MINUTES;
  return bounded * 60;
}

export function getConfigErrors() {
  const errors = [];
  if (!getSessionSecret()) errors.push("DB_SESSION_SECRET");
  if (!normalizeText(process.env.DB_SECURITY_CODE_HASH) && !normalizeText(process.env.DB_SECURITY_CODE)) {
    errors.push("DB_SECURITY_CODE_HASH");
  }
  if (
    !normalizeText(process.env.DB_TOTP_SECRET)
    && !normalizeText(process.env.DB_BACKUP_CODE_HASH)
    && !normalizeText(process.env.DB_BACKUP_CODE)
  ) {
    errors.push("DB_TOTP_SECRET");
  }
  return errors;
}

export function verifyCredentials({ securityCode, authenticatorCode }) {
  if (!verifySecurityCode(securityCode)) {
    return { ok: false, reason: "invalid_credentials" };
  }
  if (!verifySecondFactor(authenticatorCode)) {
    return { ok: false, reason: "invalid_credentials" };
  }
  return { ok: true };
}

function signSessionPayload(payloadBase64) {
  const secret = getSessionSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

export function createSessionToken() {
  const secret = getSessionSecret();
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  const ttl = getSessionTtlSeconds();
  const payload = {
    v: 1,
    iat: now,
    exp: now + ttl,
    nonce: crypto.randomBytes(12).toString("base64url"),
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signSessionPayload(payloadBase64);
  if (!signature) return null;
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token) {
  const rawToken = normalizeText(token);
  if (!rawToken || !rawToken.includes(".")) return { ok: false };
  const [payloadBase64, signature] = rawToken.split(".");
  if (!payloadBase64 || !signature) return { ok: false };
  const expectedSignature = signSessionPayload(payloadBase64);
  if (!expectedSignature || !constantTimeEqual(signature, expectedSignature)) return { ok: false };
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
  } catch (_error) {
    return { ok: false };
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload || typeof payload.exp !== "number" || payload.exp <= now) {
    return { ok: false };
  }
  return { ok: true, payload };
}

export function parseCookies(req) {
  const header = req?.headers?.cookie || "";
  if (!header) return {};
  return header.split(";").reduce((acc, entry) => {
    const [rawKey, ...rest] = entry.split("=");
    const key = String(rawKey || "").trim();
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("=").trim());
    return acc;
  }, {});
}

export function readSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[DATABASE_SESSION_COOKIE] || "";
  return verifySessionToken(token);
}

export function buildSessionCookie(token) {
  const ttl = getSessionTtlSeconds();
  const parts = [
    `${DATABASE_SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${ttl}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie() {
  const parts = [
    `${DATABASE_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export async function readJsonBody(req) {
  if (req?.body && typeof req.body === "object") return req.body;
  if (typeof req?.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_error) {
      return {};
    }
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return {};
  }
}
