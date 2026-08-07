import { NextResponse } from "next/server";
import { z } from "zod";
import { automationRulesRepository } from "@/lib/db/repositories/automationRules";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({
  nome: z.string().min(2),
  diasAposAtendimento: z.number().int().min(0),
  mensagem: z.string().min(3),
  ativo: z.boolean().default(true),
});

export async function GET() {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json(automationRulesRepository.findAll(session.organizationId));
}

export async function POST(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const rule = automationRulesRepository.create(session.organizationId, parsed.data);
  return NextResponse.json(rule, { status: 201 });
}
