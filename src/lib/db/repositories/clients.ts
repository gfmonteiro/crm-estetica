import { query, queryOne } from "../pg";
import type { Client, ClientTag } from "@/types";

interface ClientRow {
  id: string;
  organization_id: string;
  nome: string;
  telefone: string;
  whatsapp: string | null;
  email: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  origem: string | null;
  profissao: string | null;
  observacoes: string | null;
  status: Client["status"];
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    cpf: row.cpf ?? undefined,
    dataNascimento: row.data_nascimento ?? undefined,
    sexo: row.sexo ?? undefined,
    endereco: row.endereco ?? undefined,
    cidade: row.cidade ?? undefined,
    estado: row.estado ?? undefined,
    origem: row.origem ?? undefined,
    profissao: row.profissao ?? undefined,
    observacoes: row.observacoes ?? undefined,
    status: row.status,
    tags: (row.tags ?? []) as ClientTag[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export const clientsRepository = {
  async findAll(organizationId: string): Promise<Client[]> {
    const rows = await query<ClientRow>(
      `SELECT * FROM clients
       WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY nome COLLATE "pt_BR"`,
      [organizationId]
    );
    return rows.map(toClient);
  },

  async findById(organizationId: string, id: string): Promise<Client | undefined> {
    const row = await queryOne<ClientRow>(
      "SELECT * FROM clients WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL",
      [organizationId, id]
    );
    return row ? toClient(row) : undefined;
  },

  async create(
    organizationId: string,
    data: Omit<Client, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<Client> {
    const row = await queryOne<ClientRow>(
      `INSERT INTO clients
         (organization_id, nome, telefone, whatsapp, email, cpf, data_nascimento,
          sexo, endereco, cidade, estado, origem, profissao, observacoes, status, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        organizationId,
        data.nome,
        data.telefone,
        data.whatsapp ?? null,
        data.email ?? null,
        data.cpf ?? null,
        data.dataNascimento ?? null,
        data.sexo ?? null,
        data.endereco ?? null,
        data.cidade ?? null,
        data.estado ?? null,
        data.origem ?? null,
        data.profissao ?? null,
        data.observacoes ?? null,
        data.status,
        data.tags ?? [],
      ]
    );
    return toClient(row!);
  },

  async update(
    organizationId: string,
    id: string,
    data: Partial<Omit<Client, "id" | "createdAt">>
  ): Promise<Client | undefined> {
    const current = await this.findById(organizationId, id);
    if (!current) return undefined;
    const merged = { ...current, ...data };
    const row = await queryOne<ClientRow>(
      `UPDATE clients SET
         nome = $1, telefone = $2, whatsapp = $3, email = $4, cpf = $5,
         data_nascimento = $6, sexo = $7, endereco = $8, cidade = $9, estado = $10,
         origem = $11, profissao = $12, observacoes = $13, status = $14, tags = $15
       WHERE organization_id = $16 AND id = $17
       RETURNING *`,
      [
        merged.nome,
        merged.telefone,
        merged.whatsapp ?? null,
        merged.email ?? null,
        merged.cpf ?? null,
        merged.dataNascimento ?? null,
        merged.sexo ?? null,
        merged.endereco ?? null,
        merged.cidade ?? null,
        merged.estado ?? null,
        merged.origem ?? null,
        merged.profissao ?? null,
        merged.observacoes ?? null,
        merged.status,
        merged.tags ?? [],
        organizationId,
        id,
      ]
    );
    return row ? toClient(row) : undefined;
  },

  async softDelete(organizationId: string, id: string): Promise<boolean> {
    const rows = await query(
      `UPDATE clients SET deleted_at = now(), status = 'inativo'
       WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [organizationId, id]
    );
    return rows.length > 0;
  },
};
