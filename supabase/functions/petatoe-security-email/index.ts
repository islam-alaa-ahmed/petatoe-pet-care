// PETATOE v9.0 Enterprise Security Suite
// Phase S2 — Email Infrastructure Edge Function
// Scope: server-side email OTP/token generation + Resend delivery only.
// Security: no plaintext OTP/token persistence; hashes only in password_reset_tokens.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type JsonMap = Record<string, unknown>;
type SecurityPurpose = 'password_reset' | 'mfa_email_otp' | 'email_verification';

type SecurityEmailRequest = {
  action?: 'send_otp';
  username?: string;
  email?: string;
  purpose?: SecurityPurpose;
  redirectUrl?: string;
  deviceFingerprintHash?: string;
  metadata?: JsonMap;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

const PURPOSE_LABEL: Record<SecurityPurpose, string> = {
  password_reset: 'إعادة تعيين كلمة المرور',
  mfa_email_otp: 'رمز تحقق الدخول',
  email_verification: 'تأكيد البريد الإلكتروني',
};

function env(name: string, fallback = ''): string {
  try { return Deno.env.get(name) || fallback; } catch (_) { return fallback; }
}

function json(status: number, body: JsonMap): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function normalize(v: unknown): string {
  return String(v ?? '').trim();
}

function normalizeLower(v: unknown): string {
  return normalize(v).toLowerCase();
}

function clientIp(req: Request): string {
  return normalize(req.headers.get('x-forwarded-for')).split(',')[0].trim() ||
    normalize(req.headers.get('cf-connecting-ip')) ||
    normalize(req.headers.get('x-real-ip')) ||
    '';
}

function randomDigits(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => String(b % 10)).join('');
}

function randomToken(bytesLength = 32): string {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function secureHash(value: string): Promise<string> {
  const pepper = env('PETATOE_SECURITY_PEPPER');
  return sha256(`${pepper}|${value}`);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function safeMetadata(value: unknown): JsonMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as JsonMap;
}

function htmlEmail(params: { otp: string; purpose: SecurityPurpose; minutes: number; username: string }): string {
  const title = PURPOSE_LABEL[params.purpose] || 'رمز أمان PETATOE';
  const safeUser = params.username.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0f172a;font-family:Arial,Tahoma,sans-serif;color:#e5e7eb;direction:rtl">
  <div style="max-width:620px;margin:0 auto;padding:28px 16px">
    <div style="background:linear-gradient(145deg,#111827,#1e293b);border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:26px;box-shadow:0 18px 50px rgba(0,0,0,.35)">
      <h1 style="margin:0 0 8px;font-size:24px;color:#fff">PETATOE Security</h1>
      <p style="margin:0 0 22px;color:#cbd5e1;line-height:1.8">طلب ${title} للحساب: <b style="color:#fff">${safeUser}</b></p>
      <div style="margin:18px 0;padding:20px;border-radius:18px;background:#020617;border:1px solid rgba(236,72,153,.32);text-align:center">
        <div style="font-size:13px;color:#94a3b8;margin-bottom:8px">رمز التحقق</div>
        <div style="font-size:40px;letter-spacing:10px;font-weight:900;color:#f9a8d4;direction:ltr">${params.otp}</div>
      </div>
      <p style="margin:18px 0 0;color:#cbd5e1;line-height:1.8">الرمز صالح لمدة <b style="color:#fff">${params.minutes} دقائق</b> ويُستخدم مرة واحدة فقط.</p>
      <p style="margin:12px 0 0;color:#fca5a5;line-height:1.8;font-size:13px">إذا لم تطلب هذا الإجراء، تجاهل الرسالة ولا تشارك الرمز مع أي شخص.</p>
    </div>
    <p style="text-align:center;color:#64748b;font-size:12px;margin:18px 0 0">PETATOE v9.0 Enterprise Security Suite</p>
  </div>
</body>
</html>`;
}

async function sendWithResend(params: { to: string; subject: string; html: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = env('RESEND_API_KEY');
  const from = env('PETATOE_SECURITY_EMAIL_FROM', 'PETATOE Security <security@petatoe.com>');
  if (!apiKey) return { ok: false, error: 'Missing RESEND_API_KEY secret' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, error: normalize((data as JsonMap).message) || `Resend HTTP ${response.status}` };
  return { ok: true, id: normalize((data as JsonMap).id) };
}

async function audit(db: ReturnType<typeof createClient>, payload: JsonMap): Promise<void> {
  try { await db.from('login_history').insert(payload); } catch (_) { /* audit must not leak to client */ }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const supabaseUrl = env('SUPABASE_URL');
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json(500, { ok: false, error: 'Missing Supabase server secrets' });

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-petatoe-edge-function': 'petatoe-security-email' } },
  });

  const ip = clientIp(req);
  const userAgent = normalize(req.headers.get('user-agent'));
  let body: SecurityEmailRequest;
  try { body = await req.json(); } catch (_) { return json(400, { ok: false, error: 'Invalid JSON body' }); }

  const action = body.action || 'send_otp';
  const purpose = (body.purpose || 'password_reset') as SecurityPurpose;
  const usernameInput = normalize(body.username);
  const emailInput = normalizeLower(body.email);
  const deviceFingerprintHash = normalize(body.deviceFingerprintHash);
  const metadata = safeMetadata(body.metadata);

  if (action !== 'send_otp') return json(400, { ok: false, error: 'Unsupported action' });
  if (!['password_reset', 'mfa_email_otp', 'email_verification'].includes(purpose)) return json(400, { ok: false, error: 'Unsupported purpose' });
  if (!usernameInput && !emailInput) return json(400, { ok: false, error: 'Username or email is required' });

  const selector = usernameInput
    ? db.from('app_users').select('id, username, full_name, email, status, role_code').ilike('username', usernameInput).limit(1)
    : db.from('app_users').select('id, username, full_name, email, status, role_code').ilike('email', emailInput).limit(1);

  const userResult = await selector;
  const user = Array.isArray(userResult.data) ? userResult.data[0] as JsonMap | undefined : undefined;
  const publicSuccess = { ok: true, message: 'If the account is valid, a security email will be sent.' };

  if (userResult.error || !user) {
    await audit(db, { username_attempted: usernameInput || emailInput, event_type: 'password_reset_requested', success: false, failure_reason: 'user_not_found', ip_address: ip || null, user_agent: userAgent, metadata: { purpose, deviceFingerprintHash, ...metadata } });
    return json(200, publicSuccess);
  }

  const status = normalizeLower(user.status || 'active');
  const userId = normalize(user.id);
  const username = normalize(user.username || usernameInput || emailInput);
  const email = normalizeLower(user.email || emailInput);
  const active = status === 'active' || status === 'نشط';

  if (!active || !email) {
    await audit(db, { user_id: userId || null, username_attempted: username, event_type: 'password_reset_requested', success: false, failure_reason: !active ? 'inactive_user' : 'missing_email', ip_address: ip || null, user_agent: userAgent, metadata: { purpose, deviceFingerprintHash, ...metadata } });
    return json(200, publicSuccess);
  }

  const rateWindow = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const recent = await db.from('password_reset_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('purpose', purpose)
    .gte('created_at', rateWindow);
  if ((recent.count || 0) >= 5) {
    await audit(db, { user_id: userId, username_attempted: username, event_type: purpose === 'mfa_email_otp' ? 'mfa_challenge' : 'password_reset_requested', success: false, failure_reason: 'rate_limited', ip_address: ip || null, user_agent: userAgent, metadata: { purpose, deviceFingerprintHash, ...metadata } });
    return json(429, { ok: false, error: 'Too many requests. Please try again later.' });
  }

  await db.from('password_reset_tokens')
    .update({ status: 'revoked', updated_at: new Date().toISOString(), metadata: { revoked_by: 'petatoe-security-email', reason: 'new_token_requested' } })
    .eq('user_id', userId)
    .eq('purpose', purpose)
    .eq('status', 'pending')
    .is('used_at', null);

  const otp = randomDigits(6);
  const token = randomToken(32);
  const now = new Date();
  const ttlMinutes = Number(env('PETATOE_SECURITY_OTP_TTL_MINUTES', '10')) || 10;
  const expiresAt = addMinutes(now, ttlMinutes).toISOString();
  const tokenHash = await secureHash(token);
  const otpHash = await secureHash(otp);

  const insertResult = await db.from('password_reset_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    otp_hash: otpHash,
    purpose,
    status: 'pending',
    expires_at: expiresAt,
    request_ip: ip || null,
    user_agent: userAgent,
    metadata: { source: 'petatoe-security-email', deviceFingerprintHash, ...metadata },
  }).select('id').limit(1);

  if (insertResult.error) {
    await audit(db, { user_id: userId, username_attempted: username, event_type: purpose === 'mfa_email_otp' ? 'mfa_challenge' : 'password_reset_requested', success: false, failure_reason: 'token_insert_failed', ip_address: ip || null, user_agent: userAgent, metadata: { purpose, error: insertResult.error.message } });
    return json(500, { ok: false, error: 'Failed to prepare security token' });
  }

  const subject = `PETATOE Security - ${PURPOSE_LABEL[purpose]}`;
  const sendResult = await sendWithResend({ to: email, subject, html: htmlEmail({ otp, purpose, minutes: ttlMinutes, username }) });
  if (!sendResult.ok) {
    await db.from('password_reset_tokens').update({ status: 'revoked', metadata: { email_failed: true, error: sendResult.error } }).eq('token_hash', tokenHash);
    await audit(db, { user_id: userId, username_attempted: username, event_type: purpose === 'mfa_email_otp' ? 'mfa_challenge' : 'password_reset_requested', success: false, failure_reason: 'email_send_failed', ip_address: ip || null, user_agent: userAgent, metadata: { purpose, error: sendResult.error } });
    return json(502, { ok: false, error: 'Failed to send security email' });
  }

  await audit(db, {
    user_id: userId,
    username_attempted: username,
    event_type: purpose === 'mfa_email_otp' ? 'mfa_challenge' : 'password_reset_requested',
    success: true,
    mfa_required: purpose === 'mfa_email_otp',
    mfa_passed: false,
    trusted_device_used: false,
    device_fingerprint_hash: deviceFingerprintHash || null,
    ip_address: ip || null,
    user_agent: userAgent,
    metadata: { purpose, resendId: sendResult.id, tokenId: Array.isArray(insertResult.data) && insertResult.data[0] ? (insertResult.data[0] as JsonMap).id : null },
  });

  return json(200, { ok: true, message: 'Security email sent', expiresAt, purpose });
});
