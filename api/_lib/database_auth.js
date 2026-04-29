import crypto from "node:crypto";

export const DATABASE_SESSION_COOKIE = "csc_db_auth";

const DEFAULT_SESSION_TTL_MINUTES = 15;
const MIN_SESSION_TTL_MINUTES = 5;
const MAX_SESSION_TTL_MINUTES = 240;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DEFAULT_GATE_RATE_LIMIT_ATTEMPTS = 5;
const DEFAULT_GATE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const gateRateLimitStore = globalThis.__cscBuddyGateRateLimitStore || new Map();
globalThis.__cscBuddyGateRateLimitStore = gateRateLimitStore;

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

function readEnv(...names) {
  for (const name of names) {
    const value = normalizeText(process.env[name]);
    if (value) return value;
  }
  return "";
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
  const secret = readEnv("GATE_TOTP_SECRET", "DB_TOTP_SECRET");
  if (!secret || code.length !== 6) return false;
  const nowCounter = Math.floor(Date.now() / 30000);
  for (let delta = -1; delta <= 1; delta += 1) {
    if (constantTimeEqual(generateTotp(secret, nowCounter + delta), code)) {
      return true;
    }
  }
  return false;
}

function verifySecurityCode(codeInput) {
  const code = normalizeText(codeInput);
  if (!code) return false;
  const hash = readEnv("GATE_SECURITY_CODE_HASH", "DB_SECURITY_CODE_HASH");
  if (hash) return matchesHash(code, hash);
  const plain = readEnv("GATE_SECURITY_CODE", "DB_SECURITY_CODE");
  if (plain) return constantTimeEqual(code, plain);
  return false;
}

function verifyBackupCode(codeInput) {
  const code = normalizeOtp(codeInput);
  if (code.length !== 6) return false;
  const hash = readEnv("GATE_BACKUP_CODE_HASH", "DB_BACKUP_CODE_HASH");
  if (hash) return matchesHash(code, hash);
  const plain = normalizeOtp(readEnv("GATE_BACKUP_CODE", "DB_BACKUP_CODE"));
  if (plain) return constantTimeEqual(code, plain);
  return false;
}

function verifySecondFactor(codeInput) {
  if (readEnv("GATE_TOTP_SECRET", "DB_TOTP_SECRET")) {
    return verifyTotpCode(codeInput);
  }
  return verifyBackupCode(codeInput);
}

function getSessionSecret() {
  return readEnv("JWT_SECRET", "GATE_JWT_SECRET", "DB_SESSION_SECRET");
}

export function getSessionTtlSeconds() {
  const minutes = Number(readEnv("GATE_SESSION_TTL_MINUTES", "DB_SESSION_TTL_MINUTES"));
  const bounded = Number.isFinite(minutes)
    ? Math.min(MAX_SESSION_TTL_MINUTES, Math.max(MIN_SESSION_TTL_MINUTES, Math.floor(minutes)))
    : DEFAULT_SESSION_TTL_MINUTES;
  return bounded * 60;
}

export function getConfigErrors() {
  const errors = [];
  if (!getSessionSecret()) errors.push("JWT_SECRET");
  if (!readEnv("GATE_SECURITY_CODE_HASH", "DB_SECURITY_CODE_HASH") && !readEnv("GATE_SECURITY_CODE", "DB_SECURITY_CODE")) {
    errors.push("GATE_SECURITY_CODE_HASH");
  }
  if (
    !readEnv("GATE_TOTP_SECRET", "DB_TOTP_SECRET")
    && !readEnv("GATE_BACKUP_CODE_HASH", "DB_BACKUP_CODE_HASH")
    && !readEnv("GATE_BACKUP_CODE", "DB_BACKUP_CODE")
  ) {
    errors.push("GATE_TOTP_SECRET");
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

function getClientIp(req) {
  const forwarded = String(req?.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return normalizeText(req?.headers?.["cf-connecting-ip"])
    || normalizeText(req?.headers?.["x-real-ip"])
    || forwarded
    || normalizeText(req?.socket?.remoteAddress)
    || "unknown";
}

function getUserAgent(req) {
  return normalizeText(req?.headers?.["user-agent"]) || "unknown";
}

function getRequestFingerprint(req) {
  const secret = getSessionSecret();
  if (!secret || !req) return "";
  const source = `${getClientIp(req)}|${getUserAgent(req)}`;
  return crypto.createHmac("sha256", secret).update(source).digest("base64url");
}

function getRateLimitConfig() {
  const attempts = Number(readEnv("GATE_RATE_LIMIT_ATTEMPTS", "DB_RATE_LIMIT_ATTEMPTS"));
  const windowMs = Number(readEnv("GATE_RATE_LIMIT_WINDOW_MS", "DB_RATE_LIMIT_WINDOW_MS"));
  return {
    attempts: Number.isFinite(attempts) && attempts > 0 ? Math.floor(attempts) : DEFAULT_GATE_RATE_LIMIT_ATTEMPTS,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? Math.floor(windowMs) : DEFAULT_GATE_RATE_LIMIT_WINDOW_MS,
  };
}

function getRateLimitKey(req) {
  return `gate:${getClientIp(req)}`;
}

function getKvRestConfig() {
  const url = readEnv("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL");
  const token = readEnv("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

async function runKvCommand(commandParts) {
  const config = getKvRestConfig();
  if (!config) return null;
  const encoded = commandParts.map((part) => encodeURIComponent(String(part))).join("/");
  const response = await fetch(`${config.url}/${encoded}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}` },
  });
  if (!response.ok) throw new Error(`KV command failed: ${response.status}`);
  return response.json();
}

function consumeMemoryGateAttempt(req) {
  const { attempts, windowMs } = getRateLimitConfig();
  const key = getRateLimitKey(req);
  const now = Date.now();
  const current = gateRateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    gateRateLimitStore.set(key, next);
    return { ok: true, remaining: Math.max(0, attempts - 1), resetAt: next.resetAt };
  }
  if (current.count >= attempts) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  gateRateLimitStore.set(key, current);
  return { ok: true, remaining: Math.max(0, attempts - current.count), resetAt: current.resetAt };
}

export async function consumeGateAttempt(req) {
  const config = getKvRestConfig();
  if (!config) return consumeMemoryGateAttempt(req);

  try {
    const { attempts, windowMs } = getRateLimitConfig();
    const key = getRateLimitKey(req);
    const resetAt = Date.now() + windowMs;
    const increment = await runKvCommand(["incr", key]);
    const count = Number(increment?.result) || 0;
    if (count === 1) {
      await runKvCommand(["pexpire", key, windowMs]);
    }
    if (count > attempts) {
      return { ok: false, remaining: 0, resetAt };
    }
    return { ok: true, remaining: Math.max(0, attempts - count), resetAt };
  } catch (_error) {
    return consumeMemoryGateAttempt(req);
  }
}

export async function resetGateAttempts(req) {
  gateRateLimitStore.delete(getRateLimitKey(req));
  if (getKvRestConfig()) {
    try {
      await runKvCommand(["del", getRateLimitKey(req)]);
    } catch (_error) {
      // Local in-memory fallback has already been cleared.
    }
  }
}

export function createSessionToken(req) {
  const secret = getSessionSecret();
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  const ttl = getSessionTtlSeconds();
  const payload = {
    v: 1,
    iat: now,
    exp: now + ttl,
    nonce: crypto.randomBytes(12).toString("base64url"),
    fp: getRequestFingerprint(req),
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signSessionPayload(payloadBase64);
  if (!signature) return null;
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token, req = null) {
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
  if (payload.fp && req && !constantTimeEqual(payload.fp, getRequestFingerprint(req))) {
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
  return verifySessionToken(token, req);
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
