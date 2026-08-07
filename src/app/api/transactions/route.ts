import { NextResponse } from "next/server";
import { z } from "zod";
import { transactionsRepository } from "@/lib/db/repositories/transactions";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({
  clientId: z.string().optional(),
  appointmentId: z.string().optional(),
  tipo: z.enum(["receita", "despesa"]),
  categoria: z.string().min(1),
  metodoPagamento: z.enum(["pix", "cartao", "dinheiro", "boleto"]).optional(),
  valor: z.number().positive(),
  descricao: z.string().optional(),
  data: z.string().min(1),
});

export async function GET() {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json(transactionsRepository.findAll(session.organizationId));
}

export async function POST(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const transaction = transactionsRepository.create(session.organizationId, parsed.data);
  return NextResponse.json(transaction, { status: 201 });
}
