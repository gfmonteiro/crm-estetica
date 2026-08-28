import { NextResponse } from "next/server";
import { appointmentsRepository } from "@/lib/db/repositories/appointments";
import { requireOrgSession } from "@/lib/session";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updated = await appointmentsRepository.update(session.organizationId, id, body);
  if (!updated) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const ok = await appointmentsRepository.delete(session.organizationId, id);
  if (!ok) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
