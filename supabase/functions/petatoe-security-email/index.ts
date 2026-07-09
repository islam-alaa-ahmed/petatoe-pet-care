const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

type JsonMap = Record<string, unknown>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });

const sha256 = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const randomOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const requireEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret: ${name}`);
  return value;
};

const nowIso = () => new Date().toISOString();

const passwordSalt = () => `pet_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

const hashPassword = async (password: string, existingSalt?: string) => {
  const salt = existingSalt || passwordSalt();
  let hash = await sha256(`${salt}|${String(password || "")}`);
  for (let i = 0; i < 499; i += 1) {
    hash = await sha256(`${salt}|${hash}|${i}`);
  }
  return {
    algorithm: "sha256-iterated",
    iterations: 500,
    salt,
    hash,
    createdAt: nowIso(),
    version: "6.4.71",
  };
};

const strongEnoughPassword = (password: string) => {
  const p = String(password || "");
  return p.length >= 8 && /[A-Za-z]/.test(p) && /[0-9]/.test(p) && p.toLowerCase() !== "admin";
};

const safeSuccess = () => json({ ok: true, message: "If the account exists, an OTP has been sent." });

const trustedDeviceHash = async (raw: string, userId: string) => sha256(`${raw}:${userId}:trusted-device:v1`);

const truthy = (v: unknown) => v === true || String(v || "").toLowerCase() === "true" || String(v || "") === "1";

async function findActiveTrustedDevice(dbUrl: string, headers: Record<string, string>, userId: string, rawFingerprint: string) {
  if (!rawFingerprint) return null;
  const fingerprintHash = await trustedDeviceHash(rawFingerprint, userId);
  const now = encodeURIComponent(nowIso());
  const url = `${dbUrl}/rest/v1/trusted_devices?select=*&user_id=eq.${encodeURIComponent(userId)}&device_fingerprint_hash=eq.${encodeURIComponent(fingerprintHash)}&revoked_at=is.null&trusted_until=gt.${now}&limit=1`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  try {
    await fetch(`${dbUrl}/rest/v1/trusted_devices?id=eq.${row.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ last_seen_at: nowIso() }),
    });
  } catch (_) {
    // Trusted-device last_seen failures must not block login.
  }
  return row;
}

async function rememberTrustedDevice(dbUrl: string, headers: Record<string, string>, user: JsonMap, body: JsonMap, req: Request) {
  const rawFingerprint = String(body.deviceFingerprintHash || body.deviceFingerprint || "").trim();
  if (!rawFingerprint || !user || !user.id) return false;
  const fingerprintHash = await trustedDeviceHash(rawFingerprint, String(user.id));
  const trustedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const payload = {
    user_id: user.id,
    device_fingerprint_hash: fingerprintHash,
    device_name: String(body.deviceName || "Browser Device").slice(0, 120),
    platform: String(body.platform || "").slice(0, 120),
    browser: String(body.browser || "").slice(0, 180),
    trusted_until: trustedUntil,
    last_seen_at: nowIso(),
    user_agent: req.headers.get("user-agent") || String(body.userAgent || ""),
    metadata: {
      source: "petatoe-mfa-remember-device",
      language: String(body.language || ""),
    },
  };

  const upsertRes = await fetch(`${dbUrl}/rest/v1/trusted_devices?on_conflict=user_id,device_fingerprint_hash`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(payload),
  });
  return upsertRes.ok;
}

async function audit(dbUrl: string, headers: HeadersInit, payload: JsonMap) {
  try {
    await fetch(`${dbUrl}/rest/v1/login_history`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        event_type: "password_reset_requested",
        success: false,
        ...payload,
        user_agent: payload.user_agent || "edge-function",
      }),
    });
  } catch (_) {
    // Audit failures must not reveal or block auth flow responses.
  }
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
    if (req.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);

    try {
      const PETATOE_SUPABASE_URL = requireEnv("PETATOE_SUPABASE_URL");
      const PETATOE_SERVICE_ROLE_KEY = requireEnv("PETATOE_SERVICE_ROLE_KEY");
      const RESEND_API_KEY = requireEnv("RESEND_API_KEY");
      const FROM_EMAIL = requireEnv("FROM_EMAIL");

      const body = await req.json().catch(() => ({}));
      const action = String(body.action || "send_otp").trim();
      const username = String(body.username || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const purpose = String(body.purpose || "password_reset");
      const deviceFingerprintHash = String(body.deviceFingerprintHash || body.deviceFingerprint || "").trim();

      if (!username || !email) {
        return json({ ok: false, error: "USERNAME_AND_EMAIL_REQUIRED" }, 400);
      }

      if (!["password_reset", "mfa_email_otp", "email_verification"].includes(purpose)) {
        return json({ ok: false, error: "INVALID_PURPOSE" }, 400);
      }

      const dbHeaders = {
        apikey: PETATOE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${PETATOE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      };

      const userRes = await fetch(
        `${PETATOE_SUPABASE_URL}/rest/v1/app_users?select=*&username=eq.${encodeURIComponent(username)}&limit=1`,
        { headers: dbHeaders },
      );

      if (!userRes.ok) {
        const err = await userRes.text();
        return json({ ok: false, error: "USER_LOOKUP_FAILED", details: err }, 500);
      }

      const users = await userRes.json();
      const user = Array.isArray(users) ? users[0] : null;
      const userEmail = String((user && (user.email || user.legacy_payload?.email)) || "").trim().toLowerCase();

      if (!user) {
        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          username_attempted: username,
          event_type: action === "reset_password" ? "password_reset_completed" : (action === "mfa_verify" ? "mfa_verify" : (action === "mfa_send_otp" ? "mfa_challenge" : "password_reset_requested")),
          success: false,
          failure_reason: "user_not_found",
          user_agent: req.headers.get("user-agent"),
        });
        return (action === "reset_password" || action === "mfa_verify")
          ? json({ ok: false, error: "INVALID_OR_EXPIRED_OTP" }, 400)
          : safeSuccess();
      }

      if (userEmail !== email) {
        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: action === "reset_password" ? "password_reset_completed" : (action === "mfa_verify" ? "mfa_verify" : (action === "mfa_send_otp" ? "mfa_challenge" : "password_reset_requested")),
          success: false,
          failure_reason: "email_mismatch",
          user_agent: req.headers.get("user-agent"),
        });
        return (action === "reset_password" || action === "mfa_verify")
          ? json({ ok: false, error: "INVALID_OR_EXPIRED_OTP" }, 400)
          : safeSuccess();
      }

      // PETATOE v9 S3.7: Handle reset_password before send_otp so a password-save request can never fall through to OTP sending.
      if (action === "reset_password") {
        const otp = String(body.otp || "").trim();
        const newPassword = String(body.newPassword || body.password || "");
        if (!otp || !newPassword) return json({ ok: false, error: "OTP_AND_PASSWORD_REQUIRED" }, 400);
        if (!strongEnoughPassword(newPassword)) return json({ ok: false, error: "WEAK_PASSWORD" }, 400);

        const tokenRes = await fetch(
          `${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?select=*&user_id=eq.${user.id}&purpose=eq.${purpose}&status=eq.pending&order=created_at.desc&limit=1`,
          { headers: dbHeaders },
        );
        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          return json({ ok: false, error: "TOKEN_LOOKUP_FAILED", details: err }, 500);
        }
        const tokens = await tokenRes.json();
        const token = Array.isArray(tokens) ? tokens[0] : null;
        if (!token || new Date(String(token.expires_at)).getTime() < Date.now()) {
          if (token) {
            await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?id=eq.${token.id}`, {
              method: "PATCH",
              headers: dbHeaders,
              body: JSON.stringify({ status: "expired" }),
            });
          }
          return json({ ok: false, error: "INVALID_OR_EXPIRED_OTP" }, 400);
        }
        if (Number(token.attempts || 0) >= Number(token.max_attempts || 5)) {
          await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?id=eq.${token.id}`, {
            method: "PATCH",
            headers: dbHeaders,
            body: JSON.stringify({ status: "blocked" }),
          });
          return json({ ok: false, error: "INVALID_OR_EXPIRED_OTP" }, 400);
        }

        const expectedHash = await sha256(`${otp}:${user.id}:${purpose}`);
        if (expectedHash !== String(token.otp_hash || "")) {
          await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?id=eq.${token.id}`, {
            method: "PATCH",
            headers: dbHeaders,
            body: JSON.stringify({ attempts: Number(token.attempts || 0) + 1 }),
          });
          return json({ ok: false, error: "INVALID_OR_EXPIRED_OTP" }, 400);
        }

        const legacy = user.legacy_payload && typeof user.legacy_payload === "object" ? user.legacy_payload : {};
        const passwordHash = await hashPassword(newPassword);
        const updatedLegacy = {
          ...legacy,
          id: legacy.id || user.username,
          username: user.username,
          fullName: legacy.fullName || user.full_name || user.username,
          full_name: legacy.full_name || user.full_name || legacy.fullName || user.username,
          email: userEmail,
          phone: user.phone || legacy.phone || "",
          role: user.role_code || legacy.role || "viewer",
          role_code: user.role_code || legacy.role_code || legacy.role || "viewer",
          status: user.status || legacy.status || "active",
          passwordHash,
          passwordUpdatedAt: nowIso(),
          passwordPolicy: "reset_by_email_otp",
          passwordResetAt: nowIso(),
          mustChangePassword: false,
          bootstrapCredential: false,
        };
        delete updatedLegacy.password;
        delete updatedLegacy.passwordPlain;

        // PETATOE v9 S3.5:
        // The production app_users table has legacy_payload only; there is no data column.
        // Update exactly the JSONB payload used by the login normalizer, then re-read and verify it.
        const passwordUpdatedAt = nowIso();

        // PETATOE v9 S3.6:
        // Use a database RPC for password persistence. This avoids browser/REST JSONB
        // payload shape issues and updates the exact legacy_payload.passwordHash path
        // used by the existing login normalizer.
        const rpcRes = await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/rpc/petatoe_reset_user_password_legacy`, {
          method: "POST",
          headers: {
            ...dbHeaders,
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            p_user_id: user.id,
            p_password_hash: passwordHash,
            p_password_updated_at: passwordUpdatedAt,
          }),
        });

        if (!rpcRes.ok) {
          const err = await rpcRes.text();
          return json({ ok: false, error: "PASSWORD_UPDATE_RPC_FAILED", details: err }, 500);
        }

        const rpcRows = await rpcRes.json().catch(() => []);
        const rpcRow = Array.isArray(rpcRows) ? rpcRows[0] : null;
        const savedHash = String(rpcRow?.saved_hash || "");

        if (!rpcRow || savedHash !== String(passwordHash.hash || "")) {
          return json({
            ok: false,
            error: "PASSWORD_UPDATE_VERIFY_FAILED",
            details: {
              user_id: user.id,
              username: user.username,
              expected_hash_prefix: String(passwordHash.hash || "").slice(0, 12),
              saved_hash_prefix: savedHash.slice(0, 12),
            },
          }, 500);
        }

        await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?id=eq.${token.id}`, {
          method: "PATCH",
          headers: dbHeaders,
          body: JSON.stringify({ status: "used", used_at: nowIso() }),
        });

        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "password_reset_completed",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { purpose },
        });

        return json({ ok: true, action: "reset_password", message: "Password reset successfully." });
      }



      // PETATOE v9 S4.4.2: Trusted Devices management actions.
      if (action === "trusted_devices_list") {
        const listRes = await fetch(
          `${PETATOE_SUPABASE_URL}/rest/v1/trusted_devices?select=id,device_name,platform,browser,trusted_until,last_seen_at,revoked_at,created_at,metadata&user_id=eq.${encodeURIComponent(user.id)}&order=last_seen_at.desc.nullslast,created_at.desc`,
          { headers: dbHeaders },
        );
        if (!listRes.ok) {
          const err = await listRes.text();
          return json({ ok: false, action: "trusted_devices_list", error: "TRUSTED_DEVICES_LIST_FAILED", details: err }, 500);
        }
        const rows = await listRes.json().catch(() => []);
        const nowTime = Date.now();
        const devices = (Array.isArray(rows) ? rows : []).map((row) => {
          const trustedUntil = row.trusted_until ? new Date(String(row.trusted_until)).getTime() : 0;
          const revoked = !!row.revoked_at;
          return {
            id: row.id,
            deviceName: row.device_name || "Browser Device",
            platform: row.platform || "",
            browser: row.browser || "",
            trustedUntil: row.trusted_until || null,
            lastSeenAt: row.last_seen_at || null,
            createdAt: row.created_at || null,
            revokedAt: row.revoked_at || null,
            status: revoked ? "revoked" : (trustedUntil && trustedUntil < nowTime ? "expired" : "active"),
          };
        });
        return json({ ok: true, action: "trusted_devices_list", devices });
      }

      if (action === "trusted_device_revoke") {
        const deviceId = String(body.deviceId || body.id || "").trim();
        if (!deviceId) return json({ ok: false, action: "trusted_device_revoke", error: "DEVICE_ID_REQUIRED" }, 400);
        const revokeRes = await fetch(
          `${PETATOE_SUPABASE_URL}/rest/v1/trusted_devices?id=eq.${encodeURIComponent(deviceId)}&user_id=eq.${encodeURIComponent(user.id)}`,
          {
            method: "PATCH",
            headers: {
              ...dbHeaders,
              Prefer: "return=representation",
            },
            body: JSON.stringify({ revoked_at: nowIso(), metadata: { source: "petatoe-security-center", revoked_by: username } }),
          },
        );
        if (!revokeRes.ok) {
          const err = await revokeRes.text();
          return json({ ok: false, action: "trusted_device_revoke", error: "TRUSTED_DEVICE_REVOKE_FAILED", details: err }, 500);
        }
        const revokedRows = await revokeRes.json().catch(() => []);
        if (!Array.isArray(revokedRows) || !revokedRows.length) {
          return json({ ok: false, action: "trusted_device_revoke", error: "TRUSTED_DEVICE_NOT_FOUND" }, 404);
        }
        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "trusted_device_revoked",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { device_id: deviceId },
        });
        return json({ ok: true, action: "trusted_device_revoke", message: "Trusted device revoked." });
      }

      // PETATOE v9 S4.2: MFA verification completes login only after a valid email OTP.
      if (action === "mfa_verify") {
        const otp = String(body.otp || "").trim();
        const mfaPurpose = "mfa_email_otp";
        if (!otp) return json({ ok: false, error: "OTP_REQUIRED" }, 400);

        const tokenRes = await fetch(
          `${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?select=*&user_id=eq.${user.id}&purpose=eq.${mfaPurpose}&status=eq.pending&order=created_at.desc&limit=1`,
          { headers: dbHeaders },
        );
        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          return json({ ok: false, error: "MFA_TOKEN_LOOKUP_FAILED", details: err }, 500);
        }
        const tokens = await tokenRes.json();
        const token = Array.isArray(tokens) ? tokens[0] : null;
        if (!token || new Date(String(token.expires_at)).getTime() < Date.now()) {
          if (token) {
            await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?id=eq.${token.id}`, {
              method: "PATCH",
              headers: dbHeaders,
              body: JSON.stringify({ status: "expired" }),
            });
          }
          return json({ ok: false, error: "INVALID_OR_EXPIRED_OTP" }, 400);
        }
        if (Number(token.attempts || 0) >= Number(token.max_attempts || 5)) {
          await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?id=eq.${token.id}`, {
            method: "PATCH",
            headers: dbHeaders,
            body: JSON.stringify({ status: "blocked" }),
          });
          return json({ ok: false, error: "INVALID_OR_EXPIRED_OTP" }, 400);
        }

        const expectedHash = await sha256(`${otp}:${user.id}:${mfaPurpose}`);
        if (expectedHash !== String(token.otp_hash || "")) {
          await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?id=eq.${token.id}`, {
            method: "PATCH",
            headers: dbHeaders,
            body: JSON.stringify({ attempts: Number(token.attempts || 0) + 1 }),
          });
          await audit(PETATOE_SUPABASE_URL, dbHeaders, {
            user_id: user.id,
            username_attempted: username,
            event_type: "mfa_verify",
            success: false,
            failure_reason: "invalid_otp",
            mfa_required: true,
            user_agent: req.headers.get("user-agent"),
          });
          return json({ ok: false, error: "INVALID_OR_EXPIRED_OTP" }, 400);
        }

        await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?id=eq.${token.id}`, {
          method: "PATCH",
          headers: dbHeaders,
          body: JSON.stringify({ status: "used", used_at: nowIso() }),
        });

        let trustedDeviceSaved = false;
        if (truthy(body.rememberDevice)) {
          trustedDeviceSaved = await rememberTrustedDevice(PETATOE_SUPABASE_URL, dbHeaders, user, body, req);
          if (trustedDeviceSaved) {
            await audit(PETATOE_SUPABASE_URL, dbHeaders, {
              user_id: user.id,
              username_attempted: username,
              event_type: "trusted_device_added",
              success: true,
              trusted_device_used: false,
              device_fingerprint_hash: deviceFingerprintHash ? await trustedDeviceHash(deviceFingerprintHash, String(user.id)) : undefined,
              user_agent: req.headers.get("user-agent"),
              metadata: { expires_in_days: 30 },
            });
          }
        }

        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "mfa_verify",
          success: true,
          mfa_required: true,
          mfa_passed: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { purpose: mfaPurpose, trusted_device_saved: trustedDeviceSaved },
        });

        return json({ ok: true, action: "mfa_verify", trustedDeviceSaved, message: "MFA verified successfully." });
      }

      // PETATOE v9 S4.2: MFA OTP sending path is separate from password reset OTP.
      if (action === "mfa_send_otp") {
        const mfaPurpose = "mfa_email_otp";
        const activeTrustedDevice = await findActiveTrustedDevice(PETATOE_SUPABASE_URL, dbHeaders, String(user.id), deviceFingerprintHash);
        if (activeTrustedDevice) {
          await audit(PETATOE_SUPABASE_URL, dbHeaders, {
            user_id: user.id,
            username_attempted: username,
            event_type: "mfa_verify",
            success: true,
            mfa_required: true,
            mfa_passed: true,
            trusted_device_used: true,
            device_fingerprint_hash: activeTrustedDevice.device_fingerprint_hash,
            user_agent: req.headers.get("user-agent"),
            metadata: { purpose: mfaPurpose, trusted_device_id: activeTrustedDevice.id },
          });
          return json({ ok: true, action: "mfa_trusted", trusted: true, message: "Trusted device accepted." });
        }
        const otp = randomOtp();
        const tokenRaw = crypto.randomUUID();
        const otpHash = await sha256(`${otp}:${user.id}:${mfaPurpose}`);
        const tokenHash = await sha256(`${tokenRaw}:${user.id}:${mfaPurpose}`);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await fetch(
          `${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?user_id=eq.${user.id}&purpose=eq.${mfaPurpose}&status=eq.pending`,
          {
            method: "PATCH",
            headers: dbHeaders,
            body: JSON.stringify({ status: "revoked" }),
          },
        );

        const insertRes = await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens`, {
          method: "POST",
          headers: dbHeaders,
          body: JSON.stringify({
            user_id: user.id,
            token_hash: tokenHash,
            otp_hash: otpHash,
            purpose: mfaPurpose,
            status: "pending",
            expires_at: expiresAt,
            max_attempts: 5,
            user_agent: req.headers.get("user-agent"),
            metadata: { source: "petatoe-security-email", action: "mfa_send_otp" },
          }),
        });

        if (!insertRes.ok) {
          const err = await insertRes.text();
          return json({ ok: false, error: "MFA_TOKEN_INSERT_FAILED", details: err }, 500);
        }

        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>PETATOE MFA Security Code</h2>
            <p>Your login verification code is:</p>
            <div style="font-size:28px;font-weight:bold;letter-spacing:4px">${otp}</div>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not try to sign in, please review your account security.</p>
          </div>
        `;

        const mailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            subject: "PETATOE MFA Verification Code",
            html,
          }),
        });

        if (!mailRes.ok) {
          const err = await mailRes.text();
          return json({ ok: false, error: "MFA_EMAIL_SEND_FAILED", details: err }, 500);
        }

        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "mfa_challenge",
          success: true,
          mfa_required: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { purpose: mfaPurpose },
        });

        return json({ ok: true, action: "mfa_send_otp", message: "MFA OTP sent successfully." });
      }


      // PETATOE v9 S3.7: OTP sending path is explicit and returns action marker.
      if (action === "send_otp") {
        const otp = randomOtp();
        const tokenRaw = crypto.randomUUID();
        const otpHash = await sha256(`${otp}:${user.id}:${purpose}`);
        const tokenHash = await sha256(`${tokenRaw}:${user.id}:${purpose}`);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        await fetch(
          `${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens?user_id=eq.${user.id}&purpose=eq.${purpose}&status=eq.pending`,
          {
            method: "PATCH",
            headers: dbHeaders,
            body: JSON.stringify({ status: "revoked" }),
          },
        );

        const insertRes = await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/password_reset_tokens`, {
          method: "POST",
          headers: dbHeaders,
          body: JSON.stringify({
            user_id: user.id,
            token_hash: tokenHash,
            otp_hash: otpHash,
            purpose,
            status: "pending",
            expires_at: expiresAt,
            max_attempts: 5,
            user_agent: req.headers.get("user-agent"),
            metadata: { source: "petatoe-security-email" },
          }),
        });

        if (!insertRes.ok) {
          const err = await insertRes.text();
          return json({ ok: false, error: "TOKEN_INSERT_FAILED", details: err }, 500);
        }

        const subject = purpose === "mfa_email_otp"
          ? "PETATOE MFA Verification Code"
          : "PETATOE Password Reset Code";

        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>PETATOE Security Code</h2>
            <p>Your verification code is:</p>
            <div style="font-size:28px;font-weight:bold;letter-spacing:4px">${otp}</div>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `;

        const mailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            subject,
            html,
          }),
        });

        if (!mailRes.ok) {
          const err = await mailRes.text();
          return json({ ok: false, error: "EMAIL_SEND_FAILED", details: err }, 500);
        }

        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "password_reset_requested",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { purpose },
        });

        return json({ ok: true, action: "send_otp", message: "OTP sent successfully." });
      }

      return json({ ok: false, error: "INVALID_ACTION" }, 400);
    } catch (error) {
      return json({ ok: false, error: String(error?.message || error) }, 500);
    }
  },
};
