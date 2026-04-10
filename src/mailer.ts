import nodemailer from "nodemailer";
import { config } from "./config";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function assertSmtpConfigured(): void {
  if (!config.mail.from) {
    throw new Error("MAIL_FROM não configurado.");
  }
  if (!config.mail.smtp.host) {
    throw new Error("SMTP_HOST não configurado.");
  }
}

/**
 * MAIL_MODE=log: apenas log no console (útil em dev).
 * MAIL_MODE=smtp: envio real (configure SMTP_* e MAIL_FROM).
 * MAIL_MODE=off: não envia nem loga (não recomendado em produção).
 */
export async function sendTransactionalEmail(input: SendMailInput): Promise<void> {
  const { mode } = config.mail;
  if (mode === "off") {
    return;
  }
  if (mode === "log") {
    // eslint-disable-next-line no-console
    console.info("[mail:log]", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return;
  }
  assertSmtpConfigured();
  const transporter = nodemailer.createTransport({
    host: config.mail.smtp.host,
    port: config.mail.smtp.port,
    secure: config.mail.smtp.secure,
    auth:
      config.mail.smtp.user || config.mail.smtp.pass
        ? { user: config.mail.smtp.user, pass: config.mail.smtp.pass }
        : undefined,
  });
  await transporter.sendMail({
    from: config.mail.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(input.text)}</pre>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** E-mail HTML do convite com botão “Validar Usuário”. */
export function buildInviteEmailHtml(opts: { inviteLink: string; appName: string; primaryColor?: string }): string {
  const { inviteLink, appName } = opts;
  const primary = opts.primaryColor?.trim() || "#86209A";
  const safeLink = escapeHtml(inviteLink);
  const safeName = escapeHtml(appName);
  return `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#2D1F35;margin:16px">
<p>Olá,</p>
<p>Você foi convidado para acessar o painel <strong>${safeName}</strong>.</p>
<p>Clique no botão abaixo para validar seu cadastro (link válido por 7 dias):</p>
<p><a href="${safeLink}" style="display:inline-block;padding:12px 24px;background:${escapeHtml(primary)};color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Validar Usuário</a></p>
<p style="font-size:14px;color:#666">Se o botão não funcionar, copie e cole este endereço no navegador:<br/><span style="word-break:break-all">${safeLink}</span></p>
<p style="font-size:14px;color:#666">Se você não esperava este e-mail, ignore.</p>
</body></html>`;
}

export async function trySendMail(input: SendMailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sendTransactionalEmail(input);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao enviar e-mail.";
    console.error("[mail:error]", message);
    return { ok: false, error: message };
  }
}
