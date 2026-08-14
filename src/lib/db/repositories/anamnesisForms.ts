import { readOrgCollection, writeOrgCollection, generateId } from "../store";
import type { AnamnesisForm, AnamnesisCategory, AnamnesisQuestion } from "@/types";

const COLLECTION = "anamnesis_forms";

export const anamnesisFormsRepository = {
  findAll(organizationId: string): AnamnesisForm[] {
    return readOrgCollection<AnamnesisForm>(organizationId, COLLECTION).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  findById(organizationId: string, id: string): AnamnesisForm | undefined {
    return readOrgCollection<AnamnesisForm>(organizationId, COLLECTION).find((f) => f.id === id);
  },

  create(
    organizationId: string,
    data: { nome: string; corFundo: string; logoUrl?: string }
  ): AnamnesisForm {
    const all = readOrgCollection<AnamnesisForm>(organizationId, COLLECTION);
    const now = new Date().toISOString();
    const form: AnamnesisForm = {
      id: generateId(),
      nome: data.nome,
      corFundo: data.corFundo,
      logoUrl: data.logoUrl,
      ativo: true,
      categorias: [],
      createdAt: now,
      updatedAt: now,
    };
    all.push(form);
    writeOrgCollection(organizationId, COLLECTION, all);
    return form;
  },

  // Atualização "rasa" — nome, cor, logo, ativo (não mexe em categorias/perguntas).
  update(
    organizationId: string,
    id: string,
    data: Partial<Pick<AnamnesisForm, "nome" | "corFundo" | "logoUrl" | "ativo">>
  ): AnamnesisForm | undefined {
    const all = readOrgCollection<AnamnesisForm>(organizationId, COLLECTION);
    const idx = all.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    writeOrgCollection(organizationId, COLLECTION, all);
    return all[idx];
  },

  // Substitui a árvore inteira de categorias/perguntas — é assim que o
  // construtor salva (sempre manda a estrutura completa e atualizada).
  updateStructure(
    organizationId: string,
    id: string,
    categorias: AnamnesisCategory[]
  ): AnamnesisForm | undefined {
    const all = readOrgCollection<AnamnesisForm>(organizationId, COLLECTION);
    const idx = all.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], categorias, updatedAt: new Date().toISOString() };
    writeOrgCollection(organizationId, COLLECTION, all);
    return all[idx];
  },

  delete(organizationId: string, id: string): boolean {
    const all = readOrgCollection<AnamnesisForm>(organizationId, COLLECTION);
    const next = all.filter((f) => f.id !== id);
    if (next.length === all.length) return false;
    writeOrgCollection(organizationId, COLLECTION, next);
    return true;
  },
};

// Helpers de construção usados pela API ao criar categoria/pergunta avulsa
export function createEmptyCategory(nome: string, ordem: number): AnamnesisCategory {
  return { id: generateId(), nome, ordem, perguntas: [] };
}

export function createEmptyQuestion(
  texto: string,
  tipo: AnamnesisQuestion["tipo"],
  ordem: number,
  obrigatoria: boolean,
  opcoes?: string[]
): AnamnesisQuestion {
  return { id: generateId(), texto, tipo, ordem, obrigatoria, opcoes };
}
