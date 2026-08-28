import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Falha ao enviar e-mail:", error);
    throw new Error("Falha ao enviar e-mail");
  }
}

export function buildPasswordResetEmail(resetUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
      <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 16px;">
        Redefinição de Senha
      </h2>
      <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
        Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha:
      </p>
      <a
        href="${resetUrl}"
        style="display: inline-block; margin: 24px 0; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;"
      >
        Redefinir Senha
      </a>
      <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
        Se você não solicitou essa redefinição, ignore este e-mail. O link expira em 1 hora.
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        Se o botão não funcionar, copie e cole este link no navegador:<br/>
        <span style="color: #7c3aed;">${resetUrl}</span>
      </p>
    </div>
  `;
}
