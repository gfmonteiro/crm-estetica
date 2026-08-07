import { readOrgCollection, writeOrgCollection, generateId } from "../store";
import type { Procedure } from "@/types";

const COLLECTION = "procedures";

export const proceduresRepository = {
  findAll(organizationId: string): Procedure[] {
    return readOrgCollection<Procedure>(organizationId, COLLECTION).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  },

  findById(organizationId: string, id: string): Procedure | undefined {
    return readOrgCollection<Procedure>(organizationId, COLLECTION).find((p) => p.id === id);
  },

  create(
    organizationId: string,
    data: Omit<Procedure, "id" | "createdAt" | "updatedAt">
  ): Procedure {
    const all = readOrgCollection<Procedure>(organizationId, COLLECTION);
    const now = new Date().toISOString();
    const procedure: Procedure = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    all.push(procedure);
    writeOrgCollection(organizationId, COLLECTION, all);
    return procedure;
  },

  update(
    organizationId: string,
    id: string,
    data: Partial<Omit<Procedure, "id" | "createdAt">>
  ): Procedure | undefined {
    const all = readOrgCollection<Procedure>(organizationId, COLLECTION);
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    writeOrgCollection(organizationId, COLLECTION, all);
    return all[idx];
  },

  delete(organizationId: string, id: string): boolean {
    const all = readOrgCollection<Procedure>(organizationId, COLLECTION);
    const next = all.filter((p) => p.id !== id);
    if (next.length === all.length) return false;
    writeOrgCollection(organizationId, COLLECTION, next);
    return true;
  },
};
