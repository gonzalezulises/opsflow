import { Resend } from "resend";

export type SendOrgInviteEmailResult =
  | { sent: true }
  | { sent: false; reason: "missing_api_key" | "missing_from" | "send_failed"; detail?: string };

/**
 * Sends the organization invite link via Resend when `RESEND_API_KEY` is set.
 * If the key is missing, returns `sent: false` without throwing (caller still shows the URL).
 */
export async function sendOrganizationInviteEmail(params: {
  to: string;
  inviteUrl: string;
  organizationName: string;
  roleLabel: string;
}): Promise<SendOrgInviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, reason: "missing_api_key" };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) {
    return { sent: false, reason: "missing_from" };
  }

  const resend = new Resend(apiKey);
  const subject = `Invitación a ${params.organizationName} en OpsFlow`;
  const html = `
    <p>Hola,</p>
    <p>Te han invitado a unirte a la organización <strong>${escapeHtml(params.organizationName)}</strong>
    en OpsFlow con el rol <strong>${escapeHtml(params.roleLabel)}</strong>.</p>
    <p><a href="${escapeAttr(params.inviteUrl)}">Aceptar invitación</a></p>
    <p style="font-size:12px;color:#666">Si el botón no funciona, copia y pega este enlace en el navegador:<br/>
    <span style="word-break:break-all">${escapeHtml(params.inviteUrl)}</span></p>
  `;

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
  });

  if (error) {
    return {
      sent: false,
      reason: "send_failed",
      detail: typeof error.message === "string" ? error.message : JSON.stringify(error),
    };
  }

  return { sent: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
