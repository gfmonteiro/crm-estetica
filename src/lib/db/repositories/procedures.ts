import { query, queryOne } from "../pg";
import type { Procedure } from "@/types";

interface ProcedureRow {
  id: string;
  organization_id: string;
  nome: string;
  valor: string; // NUMERIC vem como string do pg
  tempo_medio_min: number;
  comissao_percentual: string;
  descricao: string | null;
  materiais: string | null;
  created_at: string;
  updated_at: string;
}

function toProcedure(row: ProcedureRow): Procedure {
  return {
    id: row.id,
    nome: row.nome,
    valor: parseFloat(row.valor),
    tempoMedioMin: row.tempo_medio_min,
    comissaoPercentual: parseFloat(row.comissao_percentual),
    descricao: row.descricao ?? undefined,
    materiais: row.materiais ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const proceduresRepository = {
  async findAll(organizationId: string): Promise<Procedure[]> {
    const rows = await query<ProcedureRow>(
      "SELECT * FROM procedures WHERE organization_id = $1 ORDER BY nome",
      [organizationId]
    );
    return rows.map(toProcedure);
  },

  async findById(organizationId: string, id: string): Promise<Procedure | undefined> {
    const row = await queryOne<ProcedureRow>(
      "SELECT * FROM procedures WHERE organization_id = $1 AND id = $2",
      [organizationId, id]
    );
    return row ? toProcedure(row) : undefined;
  },

  async create(
    organizationId: string,
    data: Omit<Procedure, "id" | "createdAt" | "updatedAt">
  ): Promise<Procedure> {
    const row = await queryOne<ProcedureRow>(
      `INSERT INTO procedures
         (organization_id, nome, valor, tempo_medio_min, comissao_percentual, descricao, materiais)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        organizationId,
        data.nome,
        data.valor,
        data.tempoMedioMin,
        data.comissaoPercentual,
        data.descricao ?? null,
        data.materiais ?? null,
      ]
    );
    return toProcedure(row!);
  },

  async update(
    organizationId: string,
    id: string,
    data: Partial<Omit<Procedure, "id" | "createdAt">>
  ): Promise<Procedure | undefined> {
    const current = await this.findById(organizationId, id);
    if (!current) return undefined;
    const merged = { ...current, ...data };
    const row = await queryOne<ProcedureRow>(
      `UPDATE procedures SET
         nome = $1, valor = $2, tempo_medio_min = $3,
         comissao_percentual = $4, descricao = $5, materiais = $6
       WHERE organization_id = $7 AND id = $8
       RETURNING *`,
      [
        merged.nome,
        merged.valor,
        merged.tempoMedioMin,
        merged.comissaoPercentual,
        merged.descricao ?? null,
        merged.materiais ?? null,
        organizationId,
        id,
      ]
    );
    return row ? toProcedure(row) : undefined;
  },

  async delete(organizationId: string, id: string): Promise<boolean> {
    const rows = await query(
      "DELETE FROM procedures WHERE organization_id = $1 AND id = $2 RETURNING id",
      [organizationId, id]
    );
    return rows.length > 0;
  },
};
