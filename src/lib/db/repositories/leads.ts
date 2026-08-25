import { query, queryOne } from "../pg";
import type { Lead, LeadActivity } from "@/types";

interface LeadRow {
  id: string;
  organization_id: string;
  nome: string;
  telefone: string;
  email: string | null;
  origem: string | null;
  procedure_interesse: string | null;
  valor_estimado: string | null;
  observacoes: string | null;
  stage: Lead["stage"];
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    email: row.email ?? undefined,
    origem: row.origem ?? undefined,
    procedureInteresse: row.procedure_interesse ?? undefined,
    valorEstimado: row.valor_estimado ? parseFloat(row.valor_estimado) : undefined,
    observacoes: row.observacoes ?? undefined,
    stage: row.stage,
    clientId: row.client_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface LeadActivityRow {
  id: string;
  organization_id: string;
  lead_id: string;
  descricao: string;
  created_at: string;
}

function toLeadActivity(row: LeadActivityRow): LeadActivity {
  return {
    id: row.id,
    leadId: row.lead_id,
    descricao: row.descricao,
    createdAt: row.created_at,
  };
}

export const leadsRepository = {
  async findAll(organizationId: string): Promise<Lead[]> {
    const rows = await query<LeadRow>(
      "SELECT * FROM leads WHERE organization_id = $1 ORDER BY created_at DESC",
      [organizationId]
    );
    return rows.map(toLead);
  },

  async findById(organizationId: string, id: string): Promise<Lead | undefined> {
    const row = await queryOne<LeadRow>(
      "SELECT * FROM leads WHERE organization_id = $1 AND id = $2",
      [organizationId, id]
    );
    return row ? toLead(row) : undefined;
  },

  async create(organizationId: string, data: Omit<Lead, "id" | "createdAt" | "updatedAt">): Promise<Lead> {
    const row = await queryOne<LeadRow>(
      `INSERT INTO leads
         (organization_id, nome, telefone, email, origem, procedure_interesse,
          valor_estimado, observacoes, stage, client_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        organizationId,
        data.nome,
        data.telefone,
        data.email ?? null,
        data.origem ?? null,
        data.procedureInteresse ?? null,
        data.valorEstimado ?? null,
        data.observacoes ?? null,
        data.stage,
        data.clientId ?? null,
      ]
    );
    return toLead(row!);
  },

  async update(
    organizationId: string,
    id: string,
    data: Partial<Omit<Lead, "id" | "createdAt">>
  ): Promise<Lead | undefined> {
    const current = await this.findById(organizationId, id);
    if (!current) return undefined;
    const merged = { ...current, ...data };
    const row = await queryOne<LeadRow>(
      `UPDATE leads SET
         nome = $1, telefone = $2, email = $3, origem = $4,
         procedure_interesse = $5, valor_estimado = $6, observacoes = $7,
         stage = $8, client_id = $9
       WHERE organization_id = $10 AND id = $11
       RETURNING *`,
      [
        merged.nome,
        merged.telefone,
        merged.email ?? null,
        merged.origem ?? null,
        merged.procedureInteresse ?? null,
        merged.valorEstimado ?? null,
        merged.observacoes ?? null,
        merged.stage,
        merged.clientId ?? null,
        organizationId,
        id,
      ]
    );
    return row ? toLead(row) : undefined;
  },

  async delete(organizationId: string, id: string): Promise<boolean> {
    const rows = await query(
      "DELETE FROM leads WHERE organization_id = $1 AND id = $2 RETURNING id",
      [organizationId, id]
    );
    return rows.length > 0;
  },
};

export const leadActivitiesRepository = {
  async findByLead(organizationId: string, leadId: string): Promise<LeadActivity[]> {
    const rows = await query<LeadActivityRow>(
      `SELECT * FROM lead_activities
       WHERE organization_id = $1 AND lead_id = $2
       ORDER BY created_at DESC`,
      [organizationId, leadId]
    );
    return rows.map(toLeadActivity);
  },

  async add(organizationId: string, leadId: string, descricao: string): Promise<LeadActivity> {
    const row = await queryOne<LeadActivityRow>(
      `INSERT INTO lead_activities (organization_id, lead_id, descricao)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [organizationId, leadId, descricao]
    );
    return toLeadActivity(row!);
  },
};
