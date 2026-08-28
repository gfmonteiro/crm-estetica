import { NextResponse } from "next/server";
import { z } from "zod";
import { leadActivitiesRepository } from "@/lib/db/repositories/leads";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({ descricao: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const activity = await leadActivitiesRepository.add(session.organizationId, id, parsed.data.descricao);
  return NextResponse.json(activity, { status: 201 });
}
