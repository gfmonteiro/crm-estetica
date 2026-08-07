import { NextResponse } from "next/server";
import { clientsRepository } from "@/lib/db/repositories/clients";
import { appointmentsRepository } from "@/lib/db/repositories/appointments";
import { transactionsRepository } from "@/lib/db/repositories/transactions";
import { requireOrgSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const client = clientsRepository.findById(session.organizationId, id);
  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const appointments = appointmentsRepository.findByClient(session.organizationId, id);
  const transactions = transactionsRepository.findByClient(session.organizationId, id);

  return NextResponse.json({ client, appointments, transactions });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updated = clientsRepository.update(session.organizationId, id, body);
  if (!updated) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const ok = clientsRepository.softDelete(session.organizationId, id);
  if (!ok) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
