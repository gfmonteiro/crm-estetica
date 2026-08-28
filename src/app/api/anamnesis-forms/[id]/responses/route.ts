import { NextResponse } from "next/server";
import { anamnesisResponsesRepository } from "@/lib/db/repositories/anamnesis";
import { requireOrgSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  return NextResponse.json(await anamnesisResponsesRepository.findByForm(session.organizationId, id));
}
