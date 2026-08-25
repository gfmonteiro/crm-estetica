import { NextResponse } from "next/server";
import { z } from "zod";
import { anamnesisFormsRepository } from "@/lib/db/repositories/anamnesisForms";
import { anamnesisResponsesRepository } from "@/lib/db/repositories/anamnesis";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({
  clientId: z.string().optional(),
  respondenteNome: z.string().optional(),
  respondenteTelefone: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const form = await anamnesisFormsRepository.findById(session.organizationId, id);
  if (!form) return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  if (form.categorias.every((c) => c.perguntas.length === 0)) {
    return NextResponse.json(
      { error: "Adicione ao menos uma pergunta antes de gerar o link." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  const response = await anamnesisResponsesRepository.create(session.organizationId, {
    formId: id,
    ...parsed.data,
  });

  return NextResponse.json({
    token: response.token,
    responseId: response.id,
    path: `/anamnese/${response.token}`,
  });
}
