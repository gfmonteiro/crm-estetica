import { NextResponse } from "next/server";
import { z } from "zod";
import { usersRepository } from "@/lib/db/repositories/users";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await usersRepository.findByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  let organizationName: string | undefined;
  if (user.organizationId) {
    const org = await organizationsRepository.findById(user.organizationId);
    if (!org) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 403 });
    }
    if (org.status === "suspenso") {
      return NextResponse.json(
        { error: "Acesso suspenso. Fale com o suporte para reativar sua conta." },
        { status: 403 }
      );
    }
    organizationName = org.nome;
  }

  const token = createSessionToken({
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    organizationName,
  });

  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
