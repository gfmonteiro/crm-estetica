import { NextResponse } from "next/server";
import { anamnesisResponsesRepository } from "@/lib/db/repositories/anamnesis";
import { anamnesisFormsRepository } from "@/lib/db/repositories/anamnesisForms";
import { requireOrgSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const response = await anamnesisResponsesRepository.findById(session.organizationId, id);
  if (!response) return NextResponse.json({ error: "Resposta não encontrada" }, { status: 404 });

  const form = await anamnesisFormsRepository.findById(session.organizationId, response.formId);
  return NextResponse.json({ response, form });
}
