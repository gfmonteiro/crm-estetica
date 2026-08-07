import { NextResponse } from "next/server";
import { z } from "zod";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { usersRepository } from "@/lib/db/repositories/users";
import { hashPassword } from "@/lib/auth";
import { requireMasterSession } from "@/lib/session";

const schema = z.object({
  nome: z.string().min(2),
  tipoNegocio: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().optional(),
  plano: z.string().optional(),
  ownerNome: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6, "Senha precisa ter pelo menos 6 caracteres"),
});

export async function GET() {
  const session = await requireMasterSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const orgs = organizationsRepository.findAll();
  const withUserCount = orgs.map((org) => ({
    ...org,
    userCount: usersRepository.findByOrganization(org.id).length,
  }));
  return NextResponse.json(withUserCount);
}

export async function POST(request: Request) {
  const session = await requireMasterSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (usersRepository.findByEmail(parsed.data.ownerEmail)) {
    return NextResponse.json(
      { error: "Já existe um usuário com este e-mail de acesso." },
      { status: 409 }
    );
  }

  const org = organizationsRepository.create({
    nome: parsed.data.nome,
    tipoNegocio: parsed.data.tipoNegocio,
    email: parsed.data.email,
    telefone: parsed.data.telefone,
    plano: parsed.data.plano,
    status: "ativo",
  });

  const passwordHash = await hashPassword(parsed.data.ownerPassword);
  const owner = usersRepository.create({
    nome: parsed.data.ownerNome,
    email: parsed.data.ownerEmail,
    passwordHash,
    role: "admin",
    organizationId: org.id,
  });

  return NextResponse.json(
    { organization: org, owner: { id: owner.id, nome: owner.nome, email: owner.email } },
    { status: 201 }
  );
}
