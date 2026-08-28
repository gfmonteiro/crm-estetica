import { NextResponse } from "next/server";
import { z } from "zod";
import { appointmentsRepository } from "@/lib/db/repositories/appointments";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({
  clientId: z.string().min(1),
  procedureId: z.string().min(1),
  profissional: z.string().min(1),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  status: z
    .enum(["agendado", "confirmado", "compareceu", "cancelado", "faltou"])
    .default("agendado"),
  observacoes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (start && end) {
    return NextResponse.json(
      await appointmentsRepository.findByDateRange(session.organizationId, start, end)
    );
  }
  return NextResponse.json(await appointmentsRepository.findAll(session.organizationId));
}

export async function POST(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const appointment = await appointmentsRepository.create(session.organizationId, parsed.data);
  return NextResponse.json(appointment, { status: 201 });
}
