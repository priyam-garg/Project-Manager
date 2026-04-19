import 'server-only';

interface InviteEmailParams {
  to: string;
  inviterName: string;
  projectName: string;
  acceptUrl: string;
  expiresAt: Date;
}

/**
 * Send an invitation email. Uses Resend via REST if configured; otherwise
 * logs the invite and returns without error so the shareable link flow
 * still works in local/dev environments.
 */
export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_EMAIL_FROM || 'Nexus <onboarding@resend.dev>';

  if (!apiKey) {
    console.info(
      `[invites] RESEND_API_KEY not set — skipping email to ${params.to}. Link: ${params.acceptUrl}`,
    );
    return;
  }

  const subject = `${params.inviterName} invited you to ${params.projectName} on Nexus`;
  const expires = params.expiresAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 12px">You've been invited to ${escapeHtml(params.projectName)}</h2>
      <p style="color:#444;line-height:1.5">
        ${escapeHtml(params.inviterName)} has invited you to collaborate on
        <strong>${escapeHtml(params.projectName)}</strong> in Nexus.
      </p>
      <p style="margin:24px 0">
        <a href="${params.acceptUrl}"
           style="background:#111;color:#fff;padding:12px 20px;border-radius:6px;
                  text-decoration:none;display:inline-block">
          Accept invitation
        </a>
      </p>
      <p style="color:#888;font-size:13px">
        This invitation expires on ${expires}. If you don't have an account yet,
        you'll be able to create one when you accept.
      </p>
      <p style="color:#aaa;font-size:12px;word-break:break-all">
        Or paste this link into your browser:<br>${params.acceptUrl}
      </p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[invites] Resend API error ${res.status}: ${body}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
