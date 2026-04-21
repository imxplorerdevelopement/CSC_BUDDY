# Database 2FA Setup (Server-Side)

This dashboard now verifies Database access using server APIs (`/api/database-auth/*`) and an HttpOnly cookie session.

## 1) Required Environment Variables

Set these in Vercel project settings:

- `DB_SESSION_SECRET`
- `DB_SESSION_TTL_MINUTES` (example: `15`)
- `DB_SECURITY_CODE_HASH`
- `DB_TOTP_SECRET`

Optional fallback:

- `DB_BACKUP_CODE_HASH`

Optional plain fallback (not recommended, only for temporary setup):

- `DB_SECURITY_CODE`
- `DB_BACKUP_CODE`

Client-side vars still needed:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
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

- `DB_SECURITY_CODE_HASH`
- `DB_BACKUP_CODE_HASH`

## 3) TOTP Secret

Use the same Base32 secret configured in your Google Authenticator enrollment and set it in:

- `DB_TOTP_SECRET`

## 4) Deploy

After updating env vars:

1. Redeploy on Vercel.
2. Open dashboard.
3. Database button now calls backend verification API.

## 5) Security Notes

- Do not use `VITE_` prefix for secret auth values.
- `DB_SESSION_SECRET` should be long and random.
- Rotate secrets if compromised.
