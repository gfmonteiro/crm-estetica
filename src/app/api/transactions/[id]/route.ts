import { NextResponse } from "next/server";
import { transactionsRepository } from "@/lib/db/repositories/transactions";
import { requireOrgSession } from "@/lib/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const ok = await transactionsRepository.delete(session.organizationId, id);
  if (!ok) return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
