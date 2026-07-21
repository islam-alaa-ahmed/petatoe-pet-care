import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "jsr:@simplewebauthn/server@13";

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
    // PETATOE v9 S4.4.3: re-activating the same device after revoke must clear revoked_at.
    // PostgREST upsert keeps omitted columns unchanged, so without this a revoked row
    // remains revoked even when trustedDeviceSaved=true.
    revoked_at: null,
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


const sessionTokenHash = async (raw: string, userId: string) => sha256(`${raw}:${userId}:enterprise-session:v1`);

async function startEnterpriseSession(dbUrl: string, headers: Record<string, string>, user: JsonMap, body: JsonMap, req: Request) {
  const rawSessionToken = String(body.sessionClientToken || body.sessionToken || "").trim();
  if (!rawSessionToken || !user || !user.id) return { ok: false, error: "SESSION_TOKEN_REQUIRED" };
  const tokenHash = await sessionTokenHash(rawSessionToken, String(user.id));
  const fingerprintRaw = String(body.deviceFingerprintHash || body.deviceFingerprint || "").trim();
  const fingerprintHash = fingerprintRaw ? await trustedDeviceHash(fingerprintRaw, String(user.id)) : null;
  const now = nowIso();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const payload = {
    user_id: user.id,
    session_token_hash: tokenHash,
    device_fingerprint_hash: fingerprintHash,
    device_name: String(body.deviceName || "Browser Device").slice(0, 120),
    platform: String(body.platform || "").slice(0, 120),
    browser: String(body.browser || "").slice(0, 180),
    ip_hash: req.headers.get("x-forwarded-for") ? await sha256(String(req.headers.get("x-forwarded-for") || "").split(",")[0].trim()) : null,
    user_agent: req.headers.get("user-agent") || String(body.userAgent || ""),
    login_source: String(body.source || "auth-login").slice(0, 80),
    last_activity_at: now,
    expires_at: expiresAt,
    revoked_at: null,
    logout_reason: null,
    metadata: {
      source: "petatoe-enterprise-session",
      language: String(body.language || ""),
    },
  };
  const res = await fetch(`${dbUrl}/rest/v1/user_sessions?on_conflict=session_token_hash`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { ok: false, error: "SESSION_START_FAILED", details: await res.text() };
  const rows = await res.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  return { ok: true, sessionId: row?.id || null, expiresAt, action: "session_start" };
}

async function endEnterpriseSession(dbUrl: string, headers: Record<string, string>, user: JsonMap, body: JsonMap) {
  const rawSessionToken = String(body.sessionClientToken || body.sessionToken || "").trim();
  if (!rawSessionToken || !user || !user.id) return { ok: false, error: "SESSION_TOKEN_REQUIRED" };
  const tokenHash = await sessionTokenHash(rawSessionToken, String(user.id));
  const res = await fetch(`${dbUrl}/rest/v1/user_sessions?session_token_hash=eq.${encodeURIComponent(tokenHash)}&user_id=eq.${encodeURIComponent(String(user.id))}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ revoked_at: nowIso(), logout_reason: String(body.logoutReason || "manual").slice(0, 80) }),
  });
  if (!res.ok) return { ok: false, error: "SESSION_END_FAILED", details: await res.text() };
  return { ok: true, action: "session_end" };
}

async function revokeEnterpriseSession(dbUrl: string, headers: Record<string, string>, user: JsonMap, body: JsonMap) {
  const sessionId = String(body.sessionId || body.id || "").trim();
  if (!sessionId || !user || !user.id) return { ok: false, error: "SESSION_ID_REQUIRED" };
  const rawSessionToken = String(body.sessionClientToken || body.sessionToken || "").trim();
  const currentHash = rawSessionToken ? await sessionTokenHash(rawSessionToken, String(user.id)) : "";

  const lookupRes = await fetch(
    `${dbUrl}/rest/v1/user_sessions?select=id,session_token_hash,revoked_at&user_id=eq.${encodeURIComponent(String(user.id))}&id=eq.${encodeURIComponent(sessionId)}&limit=1`,
    { headers },
  );
  if (!lookupRes.ok) return { ok: false, error: "SESSION_LOOKUP_FAILED", details: await lookupRes.text() };
  const rows = await lookupRes.json().catch(() => []);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return { ok: false, error: "SESSION_NOT_FOUND" };
  if (currentHash && String(row.session_token_hash || "") === currentHash) {
    return { ok: false, error: "CURRENT_SESSION_NOT_REVOCABLE" };
  }
  if (row.revoked_at) return { ok: true, action: "session_revoke", alreadyRevoked: true };

  const res = await fetch(`${dbUrl}/rest/v1/user_sessions?id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(String(user.id))}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ revoked_at: nowIso(), logout_reason: String(body.logoutReason || "revoked_by_user").slice(0, 80) }),
  });
  if (!res.ok) return { ok: false, error: "SESSION_REVOKE_FAILED", details: await res.text() };
  return { ok: true, action: "session_revoke", sessionId };
}


async function revokeAllEnterpriseSessions(dbUrl: string, headers: Record<string, string>, user: JsonMap, body: JsonMap) {
  if (!user || !user.id) return { ok: false, error: "USER_REQUIRED" };
  const keepCurrent = body.keepCurrent !== false;
  const rawSessionToken = String(body.sessionClientToken || body.sessionToken || "").trim();
  const currentHash = rawSessionToken ? await sessionTokenHash(rawSessionToken, String(user.id)) : "";
  const excludeCurrent = keepCurrent && currentHash ? `&session_token_hash=neq.${encodeURIComponent(currentHash)}` : "";
  const res = await fetch(`${dbUrl}/rest/v1/user_sessions?user_id=eq.${encodeURIComponent(String(user.id))}&revoked_at=is.null${excludeCurrent}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ revoked_at: nowIso(), logout_reason: String(body.logoutReason || "revoked_all_by_user").slice(0, 80) }),
  });
  if (!res.ok) return { ok: false, error: "SESSION_REVOKE_ALL_FAILED", details: await res.text() };
  const rows = await res.json().catch(() => []);
  return { ok: true, action: "session_revoke_all", revokedCount: Array.isArray(rows) ? rows.length : 0, keepCurrent };
}

async function touchEnterpriseSession(dbUrl: string, headers: Record<string, string>, user: JsonMap, body: JsonMap) {
  const rawSessionToken = String(body.sessionClientToken || body.sessionToken || "").trim();
  if (!rawSessionToken || !user || !user.id) return { ok: false, error: "SESSION_TOKEN_REQUIRED" };
  const tokenHash = await sessionTokenHash(rawSessionToken, String(user.id));
  const res = await fetch(`${dbUrl}/rest/v1/user_sessions?session_token_hash=eq.${encodeURIComponent(tokenHash)}&user_id=eq.${encodeURIComponent(String(user.id))}&revoked_at=is.null`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ last_activity_at: nowIso() }),
  });
  if (!res.ok) return { ok: false, error: "SESSION_TOUCH_FAILED", details: await res.text() };
  return { ok: true, action: "session_touch" };
}


async function listActiveSessions(dbUrl: string, headers: Record<string, string>, user: JsonMap, body: JsonMap) {
  const rawSessionToken = String(body.sessionClientToken || body.sessionToken || "").trim();
  const currentHash = rawSessionToken && user && user.id ? await sessionTokenHash(rawSessionToken, String(user.id)) : "";
  const res = await fetch(
    `${dbUrl}/rest/v1/user_sessions?select=id,session_token_hash,device_name,platform,browser,login_source,last_activity_at,expires_at,revoked_at,logout_reason,created_at,metadata&user_id=eq.${encodeURIComponent(String(user.id))}&order=last_activity_at.desc.nullslast,created_at.desc&limit=25`,
    { headers },
  );
  if (!res.ok) return { ok: false, error: "ACTIVE_SESSIONS_LIST_FAILED", details: await res.text() };
  const rows = await res.json().catch(() => []);
  const nowTime = Date.now();
  const sessions = (Array.isArray(rows) ? rows : []).map((row) => {
    const expires = row.expires_at ? new Date(String(row.expires_at)).getTime() : 0;
    const revoked = !!row.revoked_at;
    return {
      id: row.id,
      deviceName: row.device_name || "Browser Device",
      platform: row.platform || "",
      browser: row.browser || "",
      loginSource: row.login_source || "",
      startedAt: row.created_at || null,
      lastActivityAt: row.last_activity_at || null,
      expiresAt: row.expires_at || null,
      revokedAt: row.revoked_at || null,
      logoutReason: row.logout_reason || null,
      isCurrent: !!currentHash && String(row.session_token_hash || "") === currentHash,
      status: revoked ? "revoked" : (expires && expires < nowTime ? "expired" : "active"),
    };
  });
  return { ok: true, action: "active_sessions_list", sessions };
}


const passkeyRpName = "PETATOE Enterprise";
const passkeyRpID = () => String(Deno.env.get("PASSKEY_RP_ID") || "islam-alaa-ahmed.github.io").trim();
const passkeyAllowedOrigins = () => String(Deno.env.get("PASSKEY_ALLOWED_ORIGINS") || "https://islam-alaa-ahmed.github.io")
  .split(",").map((value) => value.trim()).filter(Boolean);
const base64UrlToBytes = (value: string) => {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};
const bytesToBase64Url = (value: Uint8Array) => {
  let raw = "";
  value.forEach((byte) => { raw += String.fromCharCode(byte); });
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

async function requireActivePasskeySession(dbUrl: string, headers: Record<string, string>, user: JsonMap, body: JsonMap) {
  const raw = String(body.sessionClientToken || body.sessionToken || "").trim();
  if (!raw || !user?.id) return false;
  const tokenHash = await sessionTokenHash(raw, String(user.id));
  const url = `${dbUrl}/rest/v1/user_sessions?select=id,expires_at,revoked_at&user_id=eq.${encodeURIComponent(String(user.id))}&session_token_hash=eq.${encodeURIComponent(tokenHash)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(nowIso())}&limit=1`;
  const response = await fetch(url, { headers });
  if (!response.ok) return false;
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}

async function savePasskeyChallenge(dbUrl: string, headers: Record<string, string>, userId: string, purpose: string, challenge: string) {
  const payload = {
    user_id: userId,
    purpose,
    challenge,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    updated_at: nowIso(),
  };
  const response = await fetch(`${dbUrl}/rest/v1/passkey_challenges?on_conflict=user_id,purpose`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`PASSKEY_CHALLENGE_SAVE_FAILED:${await response.text()}`);
}

async function readPasskeyChallenge(dbUrl: string, headers: Record<string, string>, userId: string, purpose: string) {
  const response = await fetch(`${dbUrl}/rest/v1/passkey_challenges?select=challenge,expires_at&user_id=eq.${encodeURIComponent(userId)}&purpose=eq.${encodeURIComponent(purpose)}&expires_at=gt.${encodeURIComponent(nowIso())}&limit=1`, { headers });
  if (!response.ok) throw new Error(`PASSKEY_CHALLENGE_READ_FAILED:${await response.text()}`);
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function clearPasskeyChallenge(dbUrl: string, headers: Record<string, string>, userId: string, purpose: string) {
  await fetch(`${dbUrl}/rest/v1/passkey_challenges?user_id=eq.${encodeURIComponent(userId)}&purpose=eq.${encodeURIComponent(purpose)}`, { method: "DELETE", headers });
}

async function listUserPasskeys(dbUrl: string, headers: Record<string, string>, userId: string) {
  const response = await fetch(`${dbUrl}/rest/v1/passkey_credentials?select=*&user_id=eq.${encodeURIComponent(userId)}&revoked_at=is.null&order=created_at.desc`, { headers });
  if (!response.ok) throw new Error(`PASSKEY_LIST_FAILED:${await response.text()}`);
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows : [];
}

async function handlePasskeyAction(action: string, dbUrl: string, headers: Record<string, string>, user: JsonMap, body: JsonMap, req: Request) {
  const rpID = passkeyRpID();
  const origins = passkeyAllowedOrigins();
  const requestedOrigin = String(body.origin || req.headers.get("origin") || "").replace(/\/$/, "");
  if (!origins.includes(requestedOrigin)) return { status: 400, body: { ok: false, error: "PASSKEY_ORIGIN_NOT_ALLOWED" } };
  const userId = String(user.id || "");
  const username = String(user.username || user.legacy_payload?.username || "");
  const credentials = await listUserPasskeys(dbUrl, headers, userId);

  if (action === "passkey_status") {
    const latest = credentials[0] || null;
    return {
      status: 200,
      body: {
        ok: true,
        action,
        registered: credentials.length > 0,
        credentialId: latest ? String(latest.credential_id || "") : null,
        createdAt: latest ? String(latest.created_at || "") : null,
      },
    };
  }

  if (action === "passkey_registration_options") {
    if (!(await requireActivePasskeySession(dbUrl, headers, user, body))) return { status: 401, body: { ok: false, error: "ACTIVE_SESSION_REQUIRED" } };
    const options = await generateRegistrationOptions({
      rpName: passkeyRpName,
      rpID,
      userID: new TextEncoder().encode(userId),
      userName: username,
      userDisplayName: String(user.full_name || user.fullName || username),
      attestationType: "none",
      excludeCredentials: credentials.map((row) => ({ id: String(row.credential_id), transports: row.transports || undefined })),
      authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "preferred", userVerification: "required" },
      supportedAlgorithmIDs: [-7, -257],
    });
    await savePasskeyChallenge(dbUrl, headers, userId, "registration", options.challenge);
    return { status: 200, body: { ok: true, action, options } };
  }

  if (action === "passkey_registration_verify") {
    if (!(await requireActivePasskeySession(dbUrl, headers, user, body))) return { status: 401, body: { ok: false, error: "ACTIVE_SESSION_REQUIRED" } };
    const challenge = await readPasskeyChallenge(dbUrl, headers, userId, "registration");
    if (!challenge) return { status: 400, body: { ok: false, error: "PASSKEY_CHALLENGE_EXPIRED" } };
    const verification = await verifyRegistrationResponse({
      response: body.credential as never,
      expectedChallenge: String(challenge.challenge),
      expectedOrigin: requestedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!verification.verified || !verification.registrationInfo) return { status: 400, body: { ok: false, error: "PASSKEY_REGISTRATION_NOT_VERIFIED" } };
    const info = verification.registrationInfo;
    const credential = info.credential;
    const record = {
      user_id: userId,
      credential_id: credential.id,
      public_key: bytesToBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports || [],
      device_type: info.credentialDeviceType,
      backed_up: info.credentialBackedUp,
      device_name: String(body.deviceName || "Apple Face ID").slice(0, 120),
      user_agent: req.headers.get("user-agent") || "",
      last_used_at: nowIso(),
      revoked_at: null,
      metadata: { source: "petatoe-passkey", origin: requestedOrigin },
    };
    const save = await fetch(`${dbUrl}/rest/v1/passkey_credentials?on_conflict=credential_id`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(record),
    });
    if (!save.ok) return { status: 500, body: { ok: false, error: "PASSKEY_SAVE_FAILED", details: await save.text() } };
    await clearPasskeyChallenge(dbUrl, headers, userId, "registration");
    return { status: 200, body: { ok: true, action, verified: true, credentialId: credential.id } };
  }

  if (action === "passkey_authentication_options") {
    if (!credentials.length) return { status: 404, body: { ok: false, error: "PASSKEY_NOT_REGISTERED" } };
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((row) => ({ id: String(row.credential_id), transports: row.transports || undefined })),
      userVerification: "required",
    });
    await savePasskeyChallenge(dbUrl, headers, userId, "authentication", options.challenge);
    return { status: 200, body: { ok: true, action, options } };
  }

  if (action === "passkey_authentication_verify") {
    const credentialId = String((body.credential as JsonMap)?.id || "");
    const row = credentials.find((item) => String(item.credential_id) === credentialId);
    if (!row) return { status: 404, body: { ok: false, error: "PASSKEY_CREDENTIAL_NOT_FOUND" } };
    const challenge = await readPasskeyChallenge(dbUrl, headers, userId, "authentication");
    if (!challenge) return { status: 400, body: { ok: false, error: "PASSKEY_CHALLENGE_EXPIRED" } };
    const verification = await verifyAuthenticationResponse({
      response: body.credential as never,
      expectedChallenge: String(challenge.challenge),
      expectedOrigin: requestedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: String(row.credential_id),
        publicKey: base64UrlToBytes(String(row.public_key)),
        counter: Number(row.counter || 0),
        transports: row.transports || undefined,
      },
    });
    if (!verification.verified) return { status: 401, body: { ok: false, error: "PASSKEY_AUTHENTICATION_FAILED" } };
    const update = await fetch(`${dbUrl}/rest/v1/passkey_credentials?credential_id=eq.${encodeURIComponent(credentialId)}&user_id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ counter: verification.authenticationInfo.newCounter, last_used_at: nowIso() }),
    });
    if (!update.ok) return { status: 500, body: { ok: false, error: "PASSKEY_COUNTER_UPDATE_FAILED" } };
    await clearPasskeyChallenge(dbUrl, headers, userId, "authentication");
    return {
      status: 200,
      body: {
        ok: true,
        action,
        verified: true,
        user: {
          id: user.id,
          supabase_id: user.id,
          username,
          fullName: user.full_name || user.legacy_payload?.fullName || username,
          full_name: user.full_name || user.legacy_payload?.fullName || username,
          email: user.email || user.legacy_payload?.email || "",
          phone: user.phone || user.legacy_payload?.phone || "",
          job: user.job || user.legacy_payload?.job || "",
          role: user.role_code || user.legacy_payload?.role || "viewer",
          role_code: user.role_code || user.legacy_payload?.role || "viewer",
          status: user.status || "active",
        },
      },
    };
  }

  return { status: 400, body: { ok: false, error: "PASSKEY_ACTION_NOT_SUPPORTED" } };
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

      if (["passkey_status", "passkey_registration_options", "passkey_registration_verify", "passkey_authentication_options", "passkey_authentication_verify"].includes(action)) {
        try {
          const result = await handlePasskeyAction(action, PETATOE_SUPABASE_URL, dbHeaders, user, body, req);
          await audit(PETATOE_SUPABASE_URL, dbHeaders, {
            user_id: user.id,
            username_attempted: username,
            event_type: action,
            success: result.status >= 200 && result.status < 300,
            failure_reason: result.status >= 400 ? String((result.body as JsonMap).error || "passkey_failed") : null,
            user_agent: req.headers.get("user-agent"),
          });
          return json(result.body, result.status);
        } catch (error) {
          await audit(PETATOE_SUPABASE_URL, dbHeaders, {
            user_id: user.id,
            username_attempted: username,
            event_type: action,
            success: false,
            failure_reason: String(error?.message || error),
            user_agent: req.headers.get("user-agent"),
          });
          return json({ ok: false, action, error: "PASSKEY_OPERATION_FAILED", details: String(error?.message || error) }, 400);
        }
      }

      if (action === "session_start") {
        const sessionResult = await startEnterpriseSession(PETATOE_SUPABASE_URL, dbHeaders, user, body, req);
        if (!sessionResult.ok) return json(sessionResult, 500);
        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "session_started",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { source: String(body.source || "auth-login") },
        });
        return json(sessionResult);
      }

      if (action === "session_end") {
        const sessionResult = await endEnterpriseSession(PETATOE_SUPABASE_URL, dbHeaders, user, body);
        if (!sessionResult.ok) return json(sessionResult, 500);
        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "session_ended",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { reason: String(body.logoutReason || "manual") },
        });
        return json(sessionResult);
      }

      if (action === "session_touch") {
        const sessionResult = await touchEnterpriseSession(PETATOE_SUPABASE_URL, dbHeaders, user, body);
        if (!sessionResult.ok) return json(sessionResult, sessionResult.error === "SESSION_TOUCH_FAILED" ? 401 : 500);
        return json(sessionResult);
      }

      if (action === "session_revoke") {
        const sessionResult = await revokeEnterpriseSession(PETATOE_SUPABASE_URL, dbHeaders, user, body);
        if (!sessionResult.ok) return json(sessionResult, sessionResult.error === "CURRENT_SESSION_NOT_REVOCABLE" ? 400 : 500);
        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "session_revoked",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { sessionId: String(body.sessionId || "") },
        });
        return json(sessionResult);
      }

      if (action === "session_revoke_all") {
        const sessionResult = await revokeAllEnterpriseSessions(PETATOE_SUPABASE_URL, dbHeaders, user, body);
        if (!sessionResult.ok) return json(sessionResult, 500);
        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "sessions_revoked_all",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { revokedCount: sessionResult.revokedCount || 0, keepCurrent: sessionResult.keepCurrent !== false },
        });
        return json(sessionResult);
      }

      if (action === "active_sessions_list") {
        const sessionResult = await listActiveSessions(PETATOE_SUPABASE_URL, dbHeaders, user, body);
        if (!sessionResult.ok) return json(sessionResult, 500);
        return json(sessionResult);
      }

      if (action === "security_activity_list") {
        const activityRes = await fetch(
          `${PETATOE_SUPABASE_URL}/rest/v1/login_history?select=id,event_type,success,failure_reason,mfa_required,mfa_passed,trusted_device_used,username_attempted,created_at,metadata&user_id=eq.${encodeURIComponent(String(user.id))}&order=created_at.desc&limit=50`,
          { headers: dbHeaders },
        );
        if (!activityRes.ok) {
          return json({ ok: false, action: "security_activity_list", error: "SECURITY_ACTIVITY_LIST_FAILED", details: await activityRes.text() }, 500);
        }
        const rows = await activityRes.json().catch(() => []);
        const events = (Array.isArray(rows) ? rows : []).map((row) => ({
          id: row.id,
          eventType: row.event_type || "security_event",
          success: row.success !== false,
          failureReason: row.failure_reason || "",
          mfaRequired: !!row.mfa_required,
          mfaPassed: !!row.mfa_passed,
          trustedDeviceUsed: !!row.trusted_device_used,
          usernameAttempted: row.username_attempted || username,
          createdAt: row.created_at || null,
          metadata: row.metadata || {},
        }));
        return json({ ok: true, action: "security_activity_list", events });
      }


      if (action === "user_sessions_force_revoke") {
        const requesterRole = String(user.role_code || user.legacy_payload?.role_code || user.legacy_payload?.role || "").toLowerCase();
        if (!["superadmin", "super_admin", "admin"].includes(requesterRole)) {
          return json({ ok: false, action: "user_sessions_force_revoke", error: "FORBIDDEN" }, 403);
        }
        const targetUserId = String(body.targetUserId || body.userId || "").trim();
        const targetUsername = String(body.targetUsername || "").trim();
        if (!targetUserId && !targetUsername) return json({ ok: false, action: "user_sessions_force_revoke", error: "TARGET_USER_REQUIRED" }, 400);

        const targetUrl = targetUserId
          ? `${PETATOE_SUPABASE_URL}/rest/v1/app_users?select=*&id=eq.${encodeURIComponent(targetUserId)}&limit=1`
          : `${PETATOE_SUPABASE_URL}/rest/v1/app_users?select=*&username=eq.${encodeURIComponent(targetUsername)}&limit=1`;
        const targetRes = await fetch(targetUrl, { headers: dbHeaders });
        if (!targetRes.ok) return json({ ok: false, action: "user_sessions_force_revoke", error: "TARGET_LOOKUP_FAILED", details: await targetRes.text() }, 500);
        const targetRows = await targetRes.json().catch(() => []);
        const targetUser = Array.isArray(targetRows) ? targetRows[0] : null;
        if (!targetUser || !targetUser.id) return json({ ok: false, action: "user_sessions_force_revoke", error: "TARGET_USER_NOT_FOUND" }, 404);

        const revokeResult = await revokeAllEnterpriseSessions(PETATOE_SUPABASE_URL, dbHeaders, targetUser, {
          keepCurrent: false,
          logoutReason: String(body.logoutReason || "admin_force_revoke").slice(0, 80),
        });
        if (!revokeResult.ok) return json(revokeResult, 500);
        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "sessions_force_revoked",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { targetUserId: targetUser.id, targetUsername: targetUser.username, revokedCount: revokeResult.revokedCount || 0, reason: body.logoutReason || "admin_force_revoke" },
        });
        return json({ ok: true, action: "user_sessions_force_revoke", targetUserId: targetUser.id, revokedCount: revokeResult.revokedCount || 0 });
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

        const revokeAfterPasswordReset = await revokeAllEnterpriseSessions(PETATOE_SUPABASE_URL, dbHeaders, user, {
          keepCurrent: false,
          logoutReason: "password_reset"
        });

        await audit(PETATOE_SUPABASE_URL, dbHeaders, {
          user_id: user.id,
          username_attempted: username,
          event_type: "password_reset_completed",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { purpose, sessionsRevoked: revokeAfterPasswordReset.revokedCount || 0 },
        });

        return json({ ok: true, action: "reset_password", message: "Password reset successfully.", sessionsRevoked: revokeAfterPasswordReset.revokedCount || 0 });
      }


      // PETATOE v9 S4.2: MFA verification completes login only after a valid email OTP.

      // PETATOE v9 S4.4.3.1: Trusted Devices management actions.
      // Keep these actions in the same Edge Function dispatcher used by settings/settings.js.
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
            body: JSON.stringify({
              revoked_at: nowIso(),
              metadata: { source: "petatoe-security-center", revoked_by: username },
            }),
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
