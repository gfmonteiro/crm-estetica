import { query, queryOne } from "../pg";
import type { AutomationRule } from "@/types";

interface AutomationRuleRow {
  id: string;
  organization_id: string;
  nome: string;
  dias_apos_atendimento: number;
  mensagem: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

function toAutomationRule(row: AutomationRuleRow): AutomationRule {
  return {
    id: row.id,
    nome: row.nome,
    diasAposAtendimento: row.dias_apos_atendimento,
    mensagem: row.mensagem,
    ativo: row.ativo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const automationRulesRepository = {
  async findAll(organizationId: string): Promise<AutomationRule[]> {
    const rows = await query<AutomationRuleRow>(
      "SELECT * FROM automation_rules WHERE organization_id = $1 ORDER BY dias_apos_atendimento",
      [organizationId]
    );
    return rows.map(toAutomationRule);
  },

  async findActive(organizationId: string): Promise<AutomationRule[]> {
    const rows = await query<AutomationRuleRow>(
      "SELECT * FROM automation_rules WHERE organization_id = $1 AND ativo = true ORDER BY dias_apos_atendimento",
      [organizationId]
    );
    return rows.map(toAutomationRule);
  },

  async findById(organizationId: string, id: string): Promise<AutomationRule | undefined> {
    const row = await queryOne<AutomationRuleRow>(
      "SELECT * FROM automation_rules WHERE organization_id = $1 AND id = $2",
      [organizationId, id]
    );
    return row ? toAutomationRule(row) : undefined;
  },

  async create(
    organizationId: string,
    data: Omit<AutomationRule, "id" | "createdAt" | "updatedAt">
  ): Promise<AutomationRule> {
    const row = await queryOne<AutomationRuleRow>(
      `INSERT INTO automation_rules
         (organization_id, nome, dias_apos_atendimento, mensagem, ativo)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [organizationId, data.nome, data.diasAposAtendimento, data.mensagem, data.ativo]
    );
    return toAutomationRule(row!);
  },

  async update(
    organizationId: string,
    id: string,
    data: Partial<Omit<AutomationRule, "id" | "createdAt">>
  ): Promise<AutomationRule | undefined> {
    const current = await this.findById(organizationId, id);
    if (!current) return undefined;
    const merged = { ...current, ...data };
    const row = await queryOne<AutomationRuleRow>(
      `UPDATE automation_rules SET
         nome = $1, dias_apos_atendimento = $2, mensagem = $3, ativo = $4
       WHERE organization_id = $5 AND id = $6
       RETURNING *`,
      [merged.nome, merged.diasAposAtendimento, merged.mensagem, merged.ativo, organizationId, id]
    );
    return row ? toAutomationRule(row) : undefined;
  },

  async delete(organizationId: string, id: string): Promise<boolean> {
    const rows = await query(
      "DELETE FROM automation_rules WHERE organization_id = $1 AND id = $2 RETURNING id",
      [organizationId, id]
    );
    return rows.length > 0;
  },
};
