import { readOrgCollection, writeOrgCollection, generateId } from "../store";
import type { Client } from "@/types";

const COLLECTION = "clients";

export const clientsRepository = {
  findAll(organizationId: string): Client[] {
    return readOrgCollection<Client>(organizationId, COLLECTION)
      .filter((c) => !c.deletedAt)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  },

  findById(organizationId: string, id: string): Client | undefined {
    return readOrgCollection<Client>(organizationId, COLLECTION).find(
      (c) => c.id === id && !c.deletedAt
    );
  },

  create(
    organizationId: string,
    data: Omit<Client, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Client {
    const all = readOrgCollection<Client>(organizationId, COLLECTION);
    const now = new Date().toISOString();
    const client: Client = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    all.push(client);
    writeOrgCollection(organizationId, COLLECTION, all);
    return client;
  },

  update(
    organizationId: string,
    id: string,
    data: Partial<Omit<Client, "id" | "createdAt">>
  ): Client | undefined {
    const all = readOrgCollection<Client>(organizationId, COLLECTION);
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    writeOrgCollection(organizationId, COLLECTION, all);
    return all[idx];
  },

  // Soft delete — histórico de cliente nunca é apagado de verdade.
  softDelete(organizationId: string, id: string): boolean {
    const all = readOrgCollection<Client>(organizationId, COLLECTION);
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    all[idx].deletedAt = new Date().toISOString();
    all[idx].status = "inativo";
    writeOrgCollection(organizationId, COLLECTION, all);
    return true;
  },
};
