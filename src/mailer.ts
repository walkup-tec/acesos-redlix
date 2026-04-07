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
