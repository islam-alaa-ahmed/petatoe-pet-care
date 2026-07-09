# PETATOE v9.0 — Security Email Edge Function

Supabase Edge Function used by PETATOE Enterprise Security workflows.

## Function

`petatoe-security-email`

## Required Supabase Secrets

Set these in Supabase Edge Function Secrets. Do **not** put them in GitHub frontend files.

```text
RESEND_API_KEY
PETATOE_SUPABASE_URL
PETATOE_SERVICE_ROLE_KEY
FROM_EMAIL
```

## Supported Actions

### Password reset OTP

```json
{
  "action": "send_otp",
  "username": "i.alaa",
  "email": "user@example.com",
  "purpose": "password_reset"
}
```

### Complete password reset

```json
{
  "action": "reset_password",
  "username": "i.alaa",
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewPass123",
  "purpose": "password_reset"
}
```

### MFA email OTP challenge — Phase S4.1 foundation

```json
{
  "action": "mfa_send_otp",
  "username": "i.alaa",
  "email": "user@example.com"
}
```

### MFA email OTP verification — Phase S4.1 foundation

```json
{
  "action": "mfa_verify",
  "username": "i.alaa",
  "email": "user@example.com",
  "otp": "123456"
}
```

## Security Rules

- OTP values are never stored as plaintext.
- Reset and MFA tokens are stored as hashes inside `password_reset_tokens`.
- MFA state is stored in `user_mfa`.
- Login/security events are written to `login_history` when possible.
- Sensitive database writes are performed with the server-side service role key inside the Edge Function only.
- Phase S4.1 adds backend MFA readiness only; it does not change the current frontend login behavior until Phase S4.2.
