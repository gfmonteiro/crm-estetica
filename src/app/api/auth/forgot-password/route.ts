import { NextResponse } from "next/server";
import { z } from "zod";
import { usersRepository } from "@/lib/db/repositories/users";
import { passwordResetTokensRepository } from "@/lib/db/repositories/password-reset-tokens";
import { sendEmail, buildPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await usersRepository.findByEmail(email);

  // Sempre retorna sucesso para não revelar se o e-mail existe no sistema
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const resetToken = await passwordResetTokensRepository.create(user.id);

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/login/redefinir-senha?token=${resetToken.token}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Redefinição de Senha",
      html: buildPasswordResetEmail(resetUrl),
    });
  } catch (err) {
    console.error("[forgot-password] Erro ao enviar e-mail:", err);
    // Não expõe o erro ao cliente
  }

  return NextResponse.json({ ok: true });
}
