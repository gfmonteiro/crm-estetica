import { NextResponse } from "next/server";
import { z } from "zod";
import { leadsRepository } from "@/lib/db/repositories/leads";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  origem: z.string().optional(),
  procedureInteresse: z.string().optional(),
  valorEstimado: z.number().nonnegative().optional(),
  observacoes: z.string().optional(),
  stage: z
    .enum([
      "novo_lead",
      "contato",
      "orcamento",
      "agendado",
      "compareceu",
      "finalizado",
      "retorno",
      "perdido",
    ])
    .default("novo_lead"),
});

export async function GET() {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json(leadsRepository.findAll(session.organizationId));
}

export async function POST(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const lead = leadsRepository.create(session.organizationId, parsed.data);
  return NextResponse.json(lead, { status: 201 });
}
