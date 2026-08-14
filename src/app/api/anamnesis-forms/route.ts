import { NextResponse } from "next/server";
import { z } from "zod";
import { anamnesisFormsRepository } from "@/lib/db/repositories/anamnesisForms";
import { requireOrgSession } from "@/lib/session";

const schema = z.object({
  nome: z.string().min(2),
  corFundo: z.string().min(4).default("#FAF8FB"),
  logoUrl: z.string().optional(),
});

export async function GET() {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json(anamnesisFormsRepository.findAll(session.organizationId));
}

export async function POST(request: Request) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const form = anamnesisFormsRepository.create(session.organizationId, parsed.data);
  return NextResponse.json(form, { status: 201 });
}
