import { NextResponse } from "next/server";
import { z } from "zod";
import { usersRepository } from "@/lib/db/repositories/users";
import { hashPassword } from "@/lib/auth";
import { requireMasterSession } from "@/lib/session";

const schema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "profissional"]).default("profissional"),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireMasterSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { id } = await params;
  const orgUsers = (await usersRepository.findByOrganization(id)).map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }));
  return NextResponse.json(orgUsers);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireMasterSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (await usersRepository.findByEmail(parsed.data.email)) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await usersRepository.create({
    nome: parsed.data.nome,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
    organizationId: id,
  });

  return NextResponse.json(
    { id: user.id, nome: user.nome, email: user.email, role: user.role },
    { status: 201 }
  );
}
