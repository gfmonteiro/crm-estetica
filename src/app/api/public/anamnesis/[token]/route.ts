import { NextResponse } from "next/server";
import { z } from "zod";
import { anamnesisTokenIndexRepository, anamnesisResponsesRepository } from "@/lib/db/repositories/anamnesis";
import { anamnesisFormsRepository } from "@/lib/db/repositories/anamnesisForms";

/**
 * Rota pública ? usada pelo link que a cliente recebe (sem login). Segurança
 * aqui é "capability token": só quem tem o link consegue acessar essa
 * resposta específica, ninguém navega/lista isso de fora.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const index = await anamnesisTokenIndexRepository.resolve(token);
  if (!index) return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 });

  const form = await anamnesisFormsRepository.findById(index.organizationId, index.formId);
  const response = await anamnesisResponsesRepository.findById(index.organizationId, index.responseId);
  if (!form || !response) {
    return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 });
  }
  if (!form.ativo) {
    return NextResponse.json({ error: "Esta ficha não está mais disponível." }, { status: 410 });
  }

  return NextResponse.json({ form, response });
}

const schema = z.object({
  respondenteNome: z.string().min(2),
  respondenteTelefone: z.string().optional(),
  respostas: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  assinaturaDataUrl: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const index = await anamnesisTokenIndexRepository.resolve(token);
  if (!index) return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 });

  const existing = await anamnesisResponsesRepository.findById(index.organizationId, index.responseId);
  if (!existing) return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 404 });
  if (existing.status !== "pendente") {
    return NextResponse.json({ error: "Esta ficha já foi respondida." }, { status: 409 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await anamnesisResponsesRepository.update(index.organizationId, index.responseId, {
    respondenteNome: parsed.data.respondenteNome,
    respondenteTelefone: parsed.data.respondenteTelefone,
    respostas: parsed.data.respostas,
    assinaturaClienteDataUrl: parsed.data.assinaturaDataUrl,
    assinaturaClienteEm: new Date().toISOString(),
    status: "assinada_cliente",
  });

  return NextResponse.json(updated);
}
