import { NextResponse } from "next/server";
import { z } from "zod";
import { clientsRepository } from "@/lib/db/repositories/clients";
import { requireOrgSession } from "@/lib/session";

const clientSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  telefone: z.string().min(8, "Telefone é obrigatório"),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  cpf: z.string().optional(),
  dataNascimento: z.string().optional(),
  sexo: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  origem: z.string().optional(),
  profissao: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(["ativo", "inativo", "bloqueado"]).default("ativo"),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase().trim();

  let clients = clientsRepository.findAll(session.organizationId);
  if (q) {
    clients = clients.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.telefone.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.whatsapp?.includes(q)
    );
  }
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const client = clientsRepository.create(session.organizationId, parsed.data as never);
  return NextResponse.json(client, { status: 201 });
}
