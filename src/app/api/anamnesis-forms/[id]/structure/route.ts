import { NextResponse } from "next/server";
import { z } from "zod";
import { anamnesisFormsRepository } from "@/lib/db/repositories/anamnesisForms";
import { requireOrgSession } from "@/lib/session";

const questionSchema = z.object({
  id: z.string(),
  texto: z.string().min(1),
  tipo: z.enum([
    "texto_curto",
    "texto_longo",
    "sim_nao",
    "unica_escolha",
    "multipla_escolha",
    "data",
    "numero",
  ]),
  opcoes: z.array(z.string()).optional(),
  obrigatoria: z.boolean(),
  ordem: z.number(),
});

const categorySchema = z.object({
  id: z.string(),
  nome: z.string().min(1),
  ordem: z.number(),
  perguntas: z.array(questionSchema),
});

const schema = z.object({ categorias: z.array(categorySchema) });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = anamnesisFormsRepository.updateStructure(
    session.organizationId,
    id,
    parsed.data.categorias
  );
  if (!updated) return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 });
  return NextResponse.json(updated);
}
