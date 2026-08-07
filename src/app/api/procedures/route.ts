import { NextResponse } from "next/server";
import { z } from "zod";
import { proceduresRepository } from "@/lib/db/repositories/procedures";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({
  nome: z.string().min(2),
  valor: z.number().nonnegative(),
  tempoMedioMin: z.number().int().positive(),
  comissaoPercentual: z.number().min(0).max(100).default(0),
  descricao: z.string().optional(),
  materiais: z.string().optional(),
});

export async function GET() {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json(proceduresRepository.findAll(session.organizationId));
}

export async function POST(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const procedure = proceduresRepository.create(session.organizationId, parsed.data);
  return NextResponse.json(procedure, { status: 201 });
}
