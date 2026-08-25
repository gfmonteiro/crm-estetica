import { NextResponse } from "next/server";
import { leadsRepository, leadActivitiesRepository } from "@/lib/db/repositories/leads";
import { requireOrgSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const lead = await leadsRepository.findById(session.organizationId, id);
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  const activities = await leadActivitiesRepository.findByLead(session.organizationId, id);
  return NextResponse.json({ lead, activities });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const previous = await leadsRepository.findById(session.organizationId, id);
  const updated = await leadsRepository.update(session.organizationId, id, body);
  if (!updated) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  if (previous && body.stage && body.stage !== previous.stage) {
    await leadActivitiesRepository.add(session.organizationId, id, `Etapa alterada para "${body.stage}"`);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const ok = await leadsRepository.delete(session.organizationId, id);
  if (!ok) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
