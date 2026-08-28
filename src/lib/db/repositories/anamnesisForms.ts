import { query, queryOne } from "../pg";
import type { AnamnesisForm, AnamnesisCategory, AnamnesisQuestion } from "@/types";

interface FormRow {
  id: string;
  organization_id: string;
  nome: string;
  cor_fundo: string;
  logo_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  id: string;
  organization_id: string;
  form_id: string;
  nome: string;
  ordem: number;
}

interface QuestionRow {
  id: string;
  organization_id: string;
  category_id: string;
  texto: string;
  tipo: AnamnesisQuestion["tipo"];
  opcoes: string[] | null;
  obrigatoria: boolean;
  ordem: number;
}

/**
 * Monta o AnamnesisForm completo com categorias e perguntas aninhadas,
 * usando queries separadas. O schema relacional armazena em tabelas
 * separadas, mas a interface do app espera tudo aninhado.
 */
async function buildFullForm(row: FormRow, organizationId: string): Promise<AnamnesisForm> {
  const catRows = await query<CategoryRow>(
    "SELECT * FROM anamnesis_categories WHERE form_id = $1 AND organization_id = $2 ORDER BY ordem",
    [row.id, organizationId]
  );

  const categorias: AnamnesisCategory[] = [];

  for (const cat of catRows) {
    const qRows = await query<QuestionRow>(
      "SELECT * FROM anamnesis_questions WHERE category_id = $1 AND organization_id = $2 ORDER BY ordem",
      [cat.id, organizationId]
    );
    const perguntas: AnamnesisQuestion[] = qRows.map((q) => ({
      id: q.id,
      texto: q.texto,
      tipo: q.tipo,
      opcoes: q.opcoes ?? undefined,
      obrigatoria: q.obrigatoria,
      ordem: q.ordem,
    }));
    categorias.push({
      id: cat.id,
      nome: cat.nome,
      ordem: cat.ordem,
      perguntas,
    });
  }

  return {
    id: row.id,
    nome: row.nome,
    corFundo: row.cor_fundo,
    logoUrl: row.logo_url ?? undefined,
    ativo: row.ativo,
    categorias,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const anamnesisFormsRepository = {
  async findAll(organizationId: string): Promise<AnamnesisForm[]> {
    const rows = await query<FormRow>(
      "SELECT * FROM anamnesis_forms WHERE organization_id = $1 ORDER BY created_at DESC",
      [organizationId]
    );
    const forms: AnamnesisForm[] = [];
    for (const row of rows) {
      forms.push(await buildFullForm(row, organizationId));
    }
    return forms;
  },

  async findById(organizationId: string, id: string): Promise<AnamnesisForm | undefined> {
    const row = await queryOne<FormRow>(
      "SELECT * FROM anamnesis_forms WHERE organization_id = $1 AND id = $2",
      [organizationId, id]
    );
    if (!row) return undefined;
    return buildFullForm(row, organizationId);
  },

  async create(
    organizationId: string,
    data: { nome: string; corFundo: string; logoUrl?: string }
  ): Promise<AnamnesisForm> {
    const row = await queryOne<FormRow>(
      `INSERT INTO anamnesis_forms (organization_id, nome, cor_fundo, logo_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [organizationId, data.nome, data.corFundo, data.logoUrl ?? null]
    );
    return buildFullForm(row!, organizationId);
  },

  async update(
    organizationId: string,
    id: string,
    data: Partial<Pick<AnamnesisForm, "nome" | "corFundo" | "logoUrl" | "ativo">>
  ): Promise<AnamnesisForm | undefined> {
    const current = await queryOne<FormRow>(
      "SELECT * FROM anamnesis_forms WHERE organization_id = $1 AND id = $2",
      [organizationId, id]
    );
    if (!current) return undefined;

    const nome = data.nome ?? current.nome;
    const corFundo = data.corFundo ?? current.cor_fundo;
    const logoUrl = data.logoUrl !== undefined ? data.logoUrl : current.logo_url;
    const ativo = data.ativo !== undefined ? data.ativo : current.ativo;

    const row = await queryOne<FormRow>(
      `UPDATE anamnesis_forms SET nome = $1, cor_fundo = $2, logo_url = $3, ativo = $4
       WHERE organization_id = $5 AND id = $6
       RETURNING *`,
      [nome, corFundo, logoUrl ?? null, ativo, organizationId, id]
    );
    return row ? buildFullForm(row, organizationId) : undefined;
  },

  /**
   * Substitui a árvore inteira de categorias/perguntas. Remove tudo que
   * existia e insere a nova estrutura ? assim o construtor de fichas pode
   * enviar a árvore completa de uma vez.
   */
  async updateStructure(
    organizationId: string,
    id: string,
    categorias: AnamnesisCategory[]
  ): Promise<AnamnesisForm | undefined> {
    const current = await queryOne<FormRow>(
      "SELECT * FROM anamnesis_forms WHERE organization_id = $1 AND id = $2",
      [organizationId, id]
    );
    if (!current) return undefined;

    // Remove categorias antigas (CASCADE remove perguntas automaticamente)
    await query(
      "DELETE FROM anamnesis_categories WHERE form_id = $1 AND organization_id = $2",
      [id, organizationId]
    );

    // Insere nova estrutura
    for (const cat of categorias) {
      await queryOne(
        `INSERT INTO anamnesis_categories (id, organization_id, form_id, nome, ordem)
         VALUES ($1, $2, $3, $4, $5)`,
        [cat.id, organizationId, id, cat.nome, cat.ordem]
      );
      for (const q of cat.perguntas) {
        await queryOne(
          `INSERT INTO anamnesis_questions
             (id, organization_id, category_id, texto, tipo, opcoes, obrigatoria, ordem)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [q.id, organizationId, cat.id, q.texto, q.tipo, q.opcoes ?? null, q.obrigatoria, q.ordem]
        );
      }
    }

    // Atualiza updated_at do form
    const row = await queryOne<FormRow>(
      "UPDATE anamnesis_forms SET updated_at = now() WHERE id = $1 RETURNING *",
      [id]
    );
    return row ? buildFullForm(row, organizationId) : undefined;
  },

  async delete(organizationId: string, id: string): Promise<boolean> {
    const rows = await query(
      "DELETE FROM anamnesis_forms WHERE organization_id = $1 AND id = $2 RETURNING id",
      [organizationId, id]
    );
    return rows.length > 0;
  },
};

// Helpers de construção usados pela API ao criar categoria/pergunta avulsa
export function createEmptyCategory(nome: string, ordem: number): AnamnesisCategory {
  return { id: crypto.randomUUID(), nome, ordem, perguntas: [] };
}

export function createEmptyQuestion(
  texto: string,
  tipo: AnamnesisQuestion["tipo"],
  ordem: number,
  obrigatoria: boolean,
  opcoes?: string[]
): AnamnesisQuestion {
  return { id: crypto.randomUUID(), texto, tipo, ordem, obrigatoria, opcoes };
}
