const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

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
      const username = String(body.username || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const purpose = String(body.purpose || "password_reset");

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
        `${PETATOE_SUPABASE_URL}/rest/v1/app_users?select=id,username,email,status&username=eq.${encodeURIComponent(username)}&limit=1`,
        { headers: dbHeaders },
      );

      const users = await userRes.json();
      const user = Array.isArray(users) ? users[0] : null;

      if (!user) {
        await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/login_history`, {
          method: "POST",
          headers: dbHeaders,
          body: JSON.stringify({
            username_attempted: username,
            event_type: "password_reset_requested",
            success: false,
            failure_reason: "user_not_found",
            user_agent: req.headers.get("user-agent"),
          }),
        });

        return json({ ok: true, message: "If the account exists, an OTP has been sent." });
      }

      if (String(user.email || "").toLowerCase() !== email) {
        await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/login_history`, {
          method: "POST",
          headers: dbHeaders,
          body: JSON.stringify({
            user_id: user.id,
            username_attempted: username,
            event_type: "password_reset_requested",
            success: false,
            failure_reason: "email_mismatch",
            user_agent: req.headers.get("user-agent"),
          }),
        });

        return json({ ok: true, message: "If the account exists, an OTP has been sent." });
      }

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

      await fetch(`${PETATOE_SUPABASE_URL}/rest/v1/login_history`, {
        method: "POST",
        headers: dbHeaders,
        body: JSON.stringify({
          user_id: user.id,
          username_attempted: username,
          event_type: "password_reset_requested",
          success: true,
          user_agent: req.headers.get("user-agent"),
          metadata: { purpose },
        }),
      });

      return json({ ok: true, message: "OTP sent successfully." });
    } catch (error) {
      return json({ ok: false, error: String(error?.message || error) }, 500);
    }
  },
};
