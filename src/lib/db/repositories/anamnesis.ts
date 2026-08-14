import {
  readOrgCollection,
  writeOrgCollection,
  readCollection,
  writeCollection,
  generateId,
} from "../store";
import type { AnamnesisResponse, AnamnesisTokenIndex } from "@/types";

const COLLECTION = "anamnesis_responses";
const TOKEN_INDEX = "anamnesis_tokens"; // global, não isolado por organização

export const anamnesisResponsesRepository = {
  findAll(organizationId: string): AnamnesisResponse[] {
    return readOrgCollection<AnamnesisResponse>(organizationId, COLLECTION).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  findByForm(organizationId: string, formId: string): AnamnesisResponse[] {
    return this.findAll(organizationId).filter((r) => r.formId === formId);
  },

  findById(organizationId: string, id: string): AnamnesisResponse | undefined {
    return readOrgCollection<AnamnesisResponse>(organizationId, COLLECTION).find(
      (r) => r.id === id
    );
  },

  create(
    organizationId: string,
    data: { formId: string; clientId?: string; respondenteNome?: string; respondenteTelefone?: string }
  ): AnamnesisResponse {
    const all = readOrgCollection<AnamnesisResponse>(organizationId, COLLECTION);
    const now = new Date().toISOString();
    const response: AnamnesisResponse = {
      id: generateId(),
      formId: data.formId,
      token: generateToken(),
      clientId: data.clientId,
      respondenteNome: data.respondenteNome,
      respondenteTelefone: data.respondenteTelefone,
      respostas: {},
      status: "pendente",
      createdAt: now,
      updatedAt: now,
    };
    all.push(response);
    writeOrgCollection(organizationId, COLLECTION, all);

    // Registra no índice global pra o link público conseguir achar isso
    // sem saber a organização de antemão.
    const tokens = readCollection<AnamnesisTokenIndex>(TOKEN_INDEX);
    tokens.push({
      token: response.token,
      organizationId,
      responseId: response.id,
      formId: data.formId,
      createdAt: now,
    });
    writeCollection(TOKEN_INDEX, tokens);

    return response;
  },

  update(
    organizationId: string,
    id: string,
    data: Partial<Omit<AnamnesisResponse, "id" | "createdAt" | "token" | "formId">>
  ): AnamnesisResponse | undefined {
    const all = readOrgCollection<AnamnesisResponse>(organizationId, COLLECTION);
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    writeOrgCollection(organizationId, COLLECTION, all);
    return all[idx];
  },
};

export const anamnesisTokenIndexRepository = {
  resolve(token: string): AnamnesisTokenIndex | undefined {
    return readCollection<AnamnesisTokenIndex>(TOKEN_INDEX).find((t) => t.token === token);
  },
};

function generateToken(): string {
  // Token curto e amigável pra URL, sem depender de nenhuma lib externa.
  return Array.from({ length: 24 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
}
