import { NextResponse } from "next/server";
import { organizationsRepository } from "@/lib/db/repositories/organizations";
import { requireMasterSession } from "@/lib/session";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireMasterSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const updated = await organizationsRepository.update(id, body);
  if (!updated) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireMasterSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { id } = await params;
  const ok = await organizationsRepository.delete(id);
  if (!ok) return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
