import { NextResponse } from "next/server";
import { automationRulesRepository } from "@/lib/db/repositories/automationRules";
import { requireOrgSession } from "@/lib/session";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updated = await automationRulesRepository.update(session.organizationId, id, body);
  if (!updated) return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const ok = await automationRulesRepository.delete(session.organizationId, id);
  if (!ok) return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
