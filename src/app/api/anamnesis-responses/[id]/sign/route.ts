import { NextResponse } from "next/server";
import { z } from "zod";
import { anamnesisResponsesRepository } from "@/lib/db/repositories/anamnesis";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({ assinaturaDataUrl: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const response = await anamnesisResponsesRepository.findById(session.organizationId, id);
  if (!response) return NextResponse.json({ error: "Resposta não encontrada" }, { status: 404 });
  if (response.status !== "assinada_cliente") {
    return NextResponse.json(
      { error: "A cliente ainda não assinou esta ficha." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const updated = await anamnesisResponsesRepository.update(session.organizationId, id, {
    assinaturaProfissionalDataUrl: parsed.data.assinaturaDataUrl,
    assinaturaProfissionalPor: session.nome,
    assinaturaProfissionalEm: new Date().toISOString(),
    status: "concluida",
  });

  return NextResponse.json(updated);
}
