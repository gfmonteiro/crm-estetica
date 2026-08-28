import { NextResponse } from "next/server";
import { anamnesisFormsRepository } from "@/lib/db/repositories/anamnesisForms";
import { requireOrgSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const form = await anamnesisFormsRepository.findById(session.organizationId, id);
  if (!form) return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  return NextResponse.json(form);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updated = await anamnesisFormsRepository.update(session.organizationId, id, body);
  if (!updated) return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const ok = await anamnesisFormsRepository.delete(session.organizationId, id);
  if (!ok) return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
