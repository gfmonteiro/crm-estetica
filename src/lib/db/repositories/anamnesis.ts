import { query, queryOne } from "../pg";
import type { AnamnesisResponse, AnamnesisTokenIndex } from "@/types";

interface ResponseRow {
  id: string;
  organization_id: string;
  form_id: string;
  token: string;
  client_id: string | null;
  respondente_nome: string | null;
  respondente_telefone: string | null;
  respostas: Record<string, string | string[]>;
  assinatura_cliente_data_url: string | null;
  assinatura_cliente_em: string | null;
  assinatura_profissional_data_url: string | null;
  assinatura_profissional_por: string | null;
  assinatura_profissional_em: string | null;
  status: AnamnesisResponse["status"];
  created_at: string;
  updated_at: string;
}

function toResponse(row: ResponseRow): AnamnesisResponse {
  return {
    id: row.id,
    formId: row.form_id,
    token: row.token,
    clientId: row.client_id ?? undefined,
    respondenteNome: row.respondente_nome ?? undefined,
    respondenteTelefone: row.respondente_telefone ?? undefined,
    respostas: row.respostas ?? {},
    assinaturaClienteDataUrl: row.assinatura_cliente_data_url ?? undefined,
    assinaturaClienteEm: row.assinatura_cliente_em ?? undefined,
    assinaturaProfissionalDataUrl: row.assinatura_profissional_data_url ?? undefined,
    assinaturaProfissionalPor: row.assinatura_profissional_por ?? undefined,
    assinaturaProfissionalEm: row.assinatura_profissional_em ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function generateToken(): string {
  return Array.from({ length: 24 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
}

export const anamnesisResponsesRepository = {
  async findAll(organizationId: string): Promise<AnamnesisResponse[]> {
    const rows = await query<ResponseRow>(
      "SELECT * FROM anamnesis_responses WHERE organization_id = $1 ORDER BY created_at DESC",
      [organizationId]
    );
    return rows.map(toResponse);
  },

  async findByForm(organizationId: string, formId: string): Promise<AnamnesisResponse[]> {
    const rows = await query<ResponseRow>(
      "SELECT * FROM anamnesis_responses WHERE organization_id = $1 AND form_id = $2 ORDER BY created_at DESC",
      [organizationId, formId]
    );
    return rows.map(toResponse);
  },

  async findById(organizationId: string, id: string): Promise<AnamnesisResponse | undefined> {
    const row = await queryOne<ResponseRow>(
      "SELECT * FROM anamnesis_responses WHERE organization_id = $1 AND id = $2",
      [organizationId, id]
    );
    return row ? toResponse(row) : undefined;
  },

  async create(
    organizationId: string,
    data: { formId: string; clientId?: string; respondenteNome?: string; respondenteTelefone?: string }
  ): Promise<AnamnesisResponse> {
    const token = generateToken();
    const row = await queryOne<ResponseRow>(
      `INSERT INTO anamnesis_responses
         (organization_id, form_id, token, client_id, respondente_nome, respondente_telefone)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        organizationId,
        data.formId,
        token,
        data.clientId ?? null,
        data.respondenteNome ?? null,
        data.respondenteTelefone ?? null,
      ]
    );
    return toResponse(row!);
  },

  async update(
    organizationId: string,
    id: string,
    data: Partial<Omit<AnamnesisResponse, "id" | "createdAt" | "token" | "formId">>
  ): Promise<AnamnesisResponse | undefined> {
    const current = await this.findById(organizationId, id);
    if (!current) return undefined;

    const merged = { ...current, ...data };
    const row = await queryOne<ResponseRow>(
      `UPDATE anamnesis_responses SET
         respondente_nome = $1,
         respondente_telefone = $2,
         respostas = $3,
         assinatura_cliente_data_url = $4,
         assinatura_cliente_em = $5,
         assinatura_profissional_data_url = $6,
         assinatura_profissional_por = $7,
         assinatura_profissional_em = $8,
         status = $9
       WHERE organization_id = $10 AND id = $11
       RETURNING *`,
      [
        merged.respondenteNome ?? null,
        merged.respondenteTelefone ?? null,
        JSON.stringify(merged.respostas),
        merged.assinaturaClienteDataUrl ?? null,
        merged.assinaturaClienteEm ?? null,
        merged.assinaturaProfissionalDataUrl ?? null,
        merged.assinaturaProfissionalPor ?? null,
        merged.assinaturaProfissionalEm ?? null,
        merged.status,
        organizationId,
        id,
      ]
    );
    return row ? toResponse(row) : undefined;
  },
};

/**
 * Resolve um token público para a organização/resposta correta.
 * Não precisa mais de um "índice global" separado ? o token é UNIQUE na
 * tabela anamnesis_responses, então basta buscar direto lá.
 */
export const anamnesisTokenIndexRepository = {
  async resolve(token: string): Promise<AnamnesisTokenIndex | undefined> {
    const row = await queryOne<ResponseRow>(
      "SELECT * FROM anamnesis_responses WHERE token = $1",
      [token]
    );
    if (!row) return undefined;
    return {
      token: row.token,
      organizationId: row.organization_id,
      responseId: row.id,
      formId: row.form_id,
      createdAt: row.created_at,
    };
  },
};
