import { NextResponse } from "next/server";
import { leadsRepository, leadActivitiesRepository } from "@/lib/db/repositories/leads";
import { clientsRepository } from "@/lib/db/repositories/clients";
import { requireOrgSession } from "@/lib/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const orgId = session.organizationId;

  const { id } = await params;
  const lead = leadsRepository.findById(orgId, id);
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  if (lead.clientId) {
    const existing = clientsRepository.findById(orgId, lead.clientId);
    if (existing) return NextResponse.json({ client: existing });
  }

  const client = clientsRepository.create(orgId, {
    nome: lead.nome,
    telefone: lead.telefone,
    whatsapp: lead.telefone,
    email: lead.email,
    origem: lead.origem,
    observacoes: lead.observacoes,
    status: "ativo",
    tags: ["Primeira visita"],
  });

  leadsRepository.update(orgId, id, { clientId: client.id });
  leadActivitiesRepository.add(orgId, id, `Convertido em cliente (${client.nome})`);

  return NextResponse.json({ client }, { status: 201 });
}
