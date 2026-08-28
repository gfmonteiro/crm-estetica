import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordResetTokensRepository } from "@/lib/db/repositories/password-reset-tokens";
import { usersRepository } from "@/lib/db/repositories/users";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos" },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  const resetToken = await passwordResetTokensRepository.findValidToken(token);
  if (!resetToken) {
    return NextResponse.json(
      { error: "Link invÃ¡lido ou expirado. Solicite uma nova redefiniÃ§Ã£o." },
      { status: 400 }
    );
  }

  const user = await usersRepository.findById(resetToken.userId);
  if (!user) {
    return NextResponse.json(
      { error: "UsuÃ¡rio nÃ£o encontrado" },
      { status: 400 }
    );
  }

  const newHash = await hashPassword(password);
  await usersRepository.updatePassword(user.id, newHash);
  await passwordResetTokensRepository.markAsUsed(resetToken.id);

  return NextResponse.json({ ok: true });
}
