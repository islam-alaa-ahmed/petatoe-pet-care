# PETATOE v9.0 — Phase S2 Email Infrastructure

This folder contains the Supabase Edge Function source for PETATOE security emails.

## Function

`petatoe-security-email`

## Required Supabase Secrets

Set these in Supabase before deploying/running the function:

```text
RESEND_API_KEY=your_resend_api_key
PETATOE_SECURITY_EMAIL_FROM=PETATOE Security <security@your-domain.com>
PETATOE_SECURITY_PEPPER=random_long_server_secret
PETATOE_SECURITY_OTP_TTL_MINUTES=10
```

Supabase provides these automatically inside Edge Functions:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Security Rules

- Never put `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `PETATOE_SECURITY_PEPPER` in the frontend.
- OTP is sent by email only and stored as a hash in `password_reset_tokens`.
- Token is stored as a hash only.
- Direct browser access to S1 tables remains denied by RLS.
- The current login workflow is not changed by Phase S2.

## Request Body

```json
{
  "action": "send_otp",
  "username": "Admin",
  "purpose": "password_reset"
}
```

Supported `purpose` values:

```text
password_reset
mfa_email_otp
email_verification
```

## Deployment Note

This folder is intentionally placed under:

```text
supabase/functions/petatoe-security-email/
```

because that is the standard Supabase Edge Functions path. It is a new backend path and does not modify PETATOE frontend files.
