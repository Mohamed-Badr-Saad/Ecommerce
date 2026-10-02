import { serverEnv } from "./server-env";

type PasswordResetEmail = {
  idempotencyKey: string;
  name?: string | null;
  resetUrl: string;
  to: string;
};

const resendEndpoint = "https://api.resend.com/emails";

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[character] ?? character);
}

export function buildPasswordResetEmail({ name, resetUrl }: Pick<PasswordResetEmail, "name" | "resetUrl">) {
  const safeName = name?.trim() ? escapeHtml(name.trim()) : "there";
  const safeResetUrl = escapeHtml(resetUrl);

  return {
    subject: "Reset your Talié password",
    text: [
      `Hello ${name?.trim() || "there"},`,
      "",
      "We received a request to reset your Talié password.",
      `Choose a new password: ${resetUrl}`,
      "",
      "This link expires in one hour. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5eee7;color:#2d1718;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">Your secure Talié password reset link.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5eee7;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffaf5;border:1px solid #dbc8b7">
          <tr><td style="padding:40px">
            <p style="margin:0 0 26px;color:#741f2c;font-family:Georgia,serif;font-size:34px;letter-spacing:2px">Talié</p>
            <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:30px;font-weight:500;line-height:1.2">Choose a new password</h1>
            <p style="margin:0 0 12px;font-size:16px;line-height:1.7">Hello ${safeName},</p>
            <p style="margin:0 0 28px;font-size:16px;line-height:1.7">We received a request to reset your Talié password. This link expires in one hour.</p>
            <p style="margin:0 0 30px"><a href="${safeResetUrl}" style="display:inline-block;background:#741f2c;color:#ffffff;padding:14px 24px;text-decoration:none;font-size:15px;font-weight:700">Choose a new password</a></p>
            <p style="margin:0;color:#735f59;font-size:13px;line-height:1.7">If you did not request this change, you can safely ignore this email. Your password will remain unchanged.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}

export async function sendPasswordResetEmail({ idempotencyKey, name, resetUrl, to }: PasswordResetEmail) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = serverEnv;
  if (!RESEND_API_KEY) {
    console.error("Password reset email was not sent because RESEND_API_KEY is not configured.");
    return { delivered: false as const, reason: "not-configured" as const };
  }

  const url = new URL(resetUrl);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV === "development" && url.protocol === "http:")) {
    throw new Error("Password reset links must use HTTPS outside local development.");
  }

  const message = buildPasswordResetEmail({ name, resetUrl: url.toString() });
  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // Keep provider details and recipient addresses out of logs and client responses.
    console.error(`Password reset email delivery failed with provider status ${response.status}.`);
    return { delivered: false as const, reason: "provider-error" as const };
  }

  return { delivered: true as const };
}

type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Same key within 24 hours = Resend sends the email only once. */
  idempotencyKey: string;
  replyTo?: string;
};

/** Sends any transactional email through Resend. Never throws; reports what happened instead. */
export async function sendEmail({ to, subject, html, text, idempotencyKey, replyTo }: OutgoingEmail) {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = serverEnv;
  if (!RESEND_API_KEY) return { delivered: false as const, reason: "not-configured" as const };
  try {
    const response = await fetch(resendEndpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${RESEND_API_KEY}`,
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      // Keep provider details and recipient addresses out of logs.
      console.error(`Email delivery failed with provider status ${response.status}.`);
      return { delivered: false as const, reason: "provider-error" as const };
    }
    return { delivered: true as const };
  } catch (error) {
    console.error("Email delivery failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return { delivered: false as const, reason: "network-error" as const };
  }
}

/** Whether order emails can be sent at all (an API key is configured). */
export function emailConfigured() {
  return Boolean(serverEnv.RESEND_API_KEY);
}
