# Database 2FA Setup (Server-Side)

This dashboard verifies app access using server APIs (`/api/database-auth/*`) and an HttpOnly cookie session. Supabase reads/writes go through protected server routes, so no app data is fetched until the operator enters both the security code and authenticator code.

## 1) Required Environment Variables

Set these in Vercel project settings:

- `JWT_SECRET`
- `GATE_SESSION_TTL_MINUTES` (example: `15`)
- `GATE_SECURITY_CODE_HASH`
- `GATE_TOTP_SECRET`
- `GATE_RATE_LIMIT_ATTEMPTS` (example: `5`)
- `GATE_RATE_LIMIT_WINDOW_MS` (example: `600000`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended for deploy-grade rate limiting across Vercel instances:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Upstash Redis REST aliases are also supported:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional fallback:

- `GATE_BACKUP_CODE_HASH`

Optional plain fallback (not recommended, only for temporary setup):

- `GATE_SECURITY_CODE`
- `GATE_BACKUP_CODE`

Legacy `DB_*` aliases are still supported for existing deployments, but new Vercel projects should use `GATE_*` plus `JWT_SECRET`.

Client-side vars still needed:

- `VITE_CSC_WHATSAPP_NUMBER`

## 2) Generate SHA-256 Hash Values

PowerShell examples:

```powershell
# Security code hash
$code = "YOUR_SECURITY_CODE"
node -e "const c=require('crypto'); console.log('sha256:'+c.createHash('sha256').update(process.argv[1],'utf8').digest('hex'))" $code

# Backup 6-digit code hash
$backup = "123456"
node -e "const c=require('crypto'); console.log('sha256:'+c.createHash('sha256').update(process.argv[1],'utf8').digest('hex'))" $backup
```

Copy outputs into:

- `GATE_SECURITY_CODE_HASH`
- `GATE_BACKUP_CODE_HASH`

## 3) TOTP Secret

Use the same Base32 secret configured in your Google Authenticator enrollment and set it in:

- `GATE_TOTP_SECRET`

## 4) Deploy

After updating env vars:

1. Redeploy on Vercel.
2. Open dashboard.
3. Opening the dashboard now shows the access gate before app data loads.
4. After verification, app data loads through `/api/app-config/*`.

## 5) Security Notes

- Do not use `VITE_` prefix for secret auth values.
- Do not use `NEXT_PUBLIC_` prefix for secret auth values.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- `JWT_SECRET` should be long and random.
- `/api/database-auth/verify` is rate limited by IP before credential verification. It uses Vercel KV / Upstash REST when configured and falls back to in-memory counters for local development.
- TOTP and code comparisons use timing-safe comparisons on the server.
- Session state is an HttpOnly, Secure-in-production, SameSite=Strict cookie. It is not stored in localStorage.
- The session token is bound to a request fingerprint derived from IP and user-agent, so changing either can require re-authentication.
- Rotate secrets if compromised.
