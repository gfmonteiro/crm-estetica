import { query, queryOne } from "../pg";
import type { Organization } from "@/types";

interface OrganizationRow {
  id: string;
  nome: string;
  tipo_negocio: string;
  email: string;
  telefone: string | null;
  status: Organization["status"];
  plano: string | null;
  created_at: string;
  updated_at: string;
}

function toOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    nome: row.nome,
    tipoNegocio: row.tipo_negocio,
    email: row.email,
    telefone: row.telefone ?? undefined,
    status: row.status,
    plano: row.plano ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const organizationsRepository = {
  async findAll(): Promise<Organization[]> {
    const rows = await query<OrganizationRow>(
      "SELECT * FROM organizations ORDER BY created_at DESC"
    );
    return rows.map(toOrganization);
  },

  async findById(id: string): Promise<Organization | undefined> {
    const row = await queryOne<OrganizationRow>("SELECT * FROM organizations WHERE id = $1", [id]);
    return row ? toOrganization(row) : undefined;
  },

  async create(
    data: Omit<Organization, "id" | "createdAt" | "updatedAt">
  ): Promise<Organization> {
    const row = await queryOne<OrganizationRow>(
      `INSERT INTO organizations (nome, tipo_negocio, email, telefone, status, plano)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.nome, data.tipoNegocio, data.email, data.telefone ?? null, data.status, data.plano ?? null]
    );
    return toOrganization(row!);
  },

  async update(
    id: string,
    data: Partial<Omit<Organization, "id" | "createdAt">>
  ): Promise<Organization | undefined> {
    const current = await this.findById(id);
    if (!current) return undefined;
    const merged = { ...current, ...data };
    const row = await queryOne<OrganizationRow>(
      `UPDATE organizations
       SET nome = $1, tipo_negocio = $2, email = $3, telefone = $4, status = $5, plano = $6
       WHERE id = $7
       RETURNING *`,
      [
        merged.nome,
        merged.tipoNegocio,
        merged.email,
        merged.telefone ?? null,
        merged.status,
        merged.plano ?? null,
        id,
      ]
    );
    return row ? toOrganization(row) : undefined;
  },

  // ON DELETE CASCADE no banco já apaga clientes, agenda, financeiro etc.
  // dessa organização automaticamente — não precisa de deleteOrgData() mais.
  async delete(id: string): Promise<boolean> {
    const rows = await query("DELETE FROM organizations WHERE id = $1 RETURNING id", [id]);
    return rows.length > 0;
  },
};
